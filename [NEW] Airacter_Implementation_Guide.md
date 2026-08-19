# Airacter — Implementation Guide

**Companion to:** Airacter PRD v1.0
**Purpose:** Break the PRD into small, independently testable steps suitable for handing one at a time to an AI coding agent (Google Antigravity), with a review → test → commit → push → merge loop between each step.

---

## 0. How to Use This Guide

- Each **Phase** below matches a phase in the PRD (§5 Scope & Phasing).
- Each phase is broken into **Steps**. A step is sized to be **one commit** — small enough that if something breaks, it's obvious which step caused it.
- Every step lists: **Goal**, **New files** (with folder), **Edited files**, **New packages** (if any), **New env vars** (if any), and **How to test it manually** before you commit.
- Give the agent **one step at a time**. Do not paste a whole phase at once — that defeats the purpose of small, traceable changes.
- **Hard rule for every step in this guide:** all new server logic goes in a **Next.js API route** under `src/app/api/`, never a Server Action. This is so the same backend can serve a future mobile app without a rewrite, matching how the codebase already works today (every existing feature is already API-route-based — keep it that way).
- Steps within a phase are ordered by dependency — later steps in a phase assume earlier ones are merged. Phases themselves are ordered by the PRD's phasing table, but you don't strictly have to finish a whole phase before starting the next one, except where a step explicitly says it depends on an earlier phase.
- "Test manually" suggestions assume you have `npm run dev` running, a local Postgres via `docker-compose up`, and either a browser, `curl`, or a REST client (Postman/Insomnia/Thunder Client) available. Use Prisma Studio (`npx prisma studio`) liberally to inspect DB state after each step.

---

## 1. New Packages — Summary Table

Install only what a given step needs, when you reach it — this table is for reference, not a single big install.

| Package | Phase | Purpose |
|---|---|---|
| `i18next`, `react-i18next`, `i18next-resources-to-backend`, `i18next-browser-languagedetector` | 0 | App UI localization |
| `stripe` | 1 | Stripe SDK — checkout sessions + webhook signature verification |
| `pdf-parse` | 2 | Extract text from uploaded PDF knowledge files |
| `mammoth` | 2 | Extract text from uploaded DOCX knowledge files |
| `csv-parse` | 2 | Parse uploaded CSV knowledge files |
| `telegraf` | 3 | Telegram bot framework (webhook-based, fits serverless routes) |
| `otplib` | 5 | TOTP generation/verification for 2FA |
| `qrcode` | 5 | Render the QR code shown during 2FA setup |

No SDK needed for **Paystack** (plain REST via `fetch`) or **WhatsApp Business API** (plain REST via `fetch` against the Graph API) — keeps dependencies lean, consistent with how lightweight the codebase already is.

`pgvector` (Postgres extension) is enabled via raw SQL migration, not an npm package — Prisma's `$queryRaw`/`$executeRaw` is enough to read/write vector columns.

---

## 2. New Environment Variables — Summary Table

Add to `.env` as you reach the relevant step. "Free?" reflects development/test-mode usage.

| Variable | Phase | Where to get it | Free? |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | 1 | Stripe Dashboard → Developers → API keys (test mode) | Yes, test mode |
| `STRIPE_PUBLISHABLE_KEY` | 1 | Same as above | Yes, test mode |
| `STRIPE_WEBHOOK_SECRET` | 1 | Stripe Dashboard → Developers → Webhooks (or `stripe listen` CLI for local dev) | Yes |
| `PAYSTACK_SECRET_KEY` | 1 | Paystack Dashboard → Settings → API Keys & Webhooks (test mode) | Yes, test mode |
| `PAYSTACK_PUBLIC_KEY` | 1 | Same as above | Yes, test mode |
| `TELEGRAM_BOT_TOKEN` | 3 | Message `@BotFather` on Telegram, `/newbot` | Yes, fully free |
| `WHATSAPP_ACCESS_TOKEN` | 3 | Meta for Developers → your App → WhatsApp → API Setup | Yes for sandbox/test numbers; production requires Meta Business verification (not instant, not guaranteed free of review friction) |
| `WHATSAPP_PHONE_NUMBER_ID` | 3 | Same as above | Same as above |
| `WHATSAPP_VERIFY_TOKEN` | 3 | Self-generated (any random string you also enter in the Meta webhook config) | Free |
| `WHATSAPP_APP_SECRET` | 3 | Meta for Developers → your App → Settings → Basic | Same as above |
| `PERSPECTIVE_API_KEY` | 4 (optional) | Google Cloud Console → enable "Perspective Comment Analyzer API" → Credentials | Yes, generous free quota |
| `CRON_SECRET` | 0 & 4 | Self-generated (`openssl rand -base64 32`) — protects worker/cron API routes from public invocation | Free |
| `TOTP_ENCRYPTION_KEY` | 5 | Self-generated (`openssl rand -base64 32`) — encrypts stored TOTP secrets at rest | Free |

Everything else needed (Gemini embeddings, image/file storage) reuses your existing `GEMINI_API_KEY` and Cloudinary credentials — no new keys required for Phase 2.

---

## PHASE 0 — Foundations

> **Two steps in this phase were revised after implementation review caught real flaws in the original plan** (a token-accounting bug, and a session-strategy migration that silently breaks parts of `proxy.ts` and `auth.config.ts` beyond what was originally scoped). The steps below reflect the corrected approach — see PRD §6.2.1 and §6.9.3 for the full reasoning.

### Step 0.1 — Add the `TokenGrant` model
**Goal:** Schema for FIFO (earliest-expiry-first) token accounting — the canonical spend mechanism, not just a balance filter. This replaces the originally-planned "add a nullable `expiresAt` to `TokenTransaction`" step: that simpler design has a real bug (PRD §6.2.1) where a user's *paid* tokens can be erased once an unrelated free-tier grant expires, because a plain `SUM(unexpired credits) − SUM(all debits)` doesn't track which grant a debit actually drew down.
**New files:** `prisma/migrations/<timestamp>_add_token_grant/migration.sql`
**Edited files:** `prisma/schema.prisma` (new `TokenGrant` model: `userId`, `type` [`welcome`|`subscription`|`purchase`|`admin`], `amount`, `remaining`, `expiresAt DateTime?`, `createdAt`; relation on `User`)
**New packages:** none
**New env vars:** none
**Test:** Migrate, confirm the table exists via `npx prisma studio`. `TokenTransaction` is untouched by this step — no behavior change yet.

### Step 0.2 — Implement canonical `creditTokens()` / `debitTokens()` with atomic FIFO consumption
**Goal:** Make grant-based accounting the *only* way tokens move, with concurrency safety, and rewrite balance lookup to be a cheap sum instead of a history replay.
**New files:** none
**Edited files:** `src/lib/tokens.ts` — add:
- `creditTokens(userId, type, amount, expiresAt, metadata)`: inserts a `TokenGrant` **and** a `TokenTransaction` credit row in the same DB transaction (the grant governs balance/expiry; the transaction row stays the audit trail read by billing history).
- `debitTokens(userId, amount, referenceId, metadata)`: inside a single Prisma interactive transaction, selects the user's unexpired grants with `remaining > 0` ordered `expiresAt ASC NULLS LAST`, using row-level locking (`SELECT ... FOR UPDATE` via `tx.$queryRaw`) so two concurrent debits can't both read the same "sufficient balance" snapshot and both succeed — this is required correctness, not an optimization, since concurrent requests from the same user (two tabs, a retry, a flaky connection) are routine. Verifies total available `remaining` covers `amount` (throws an insufficient-balance error otherwise, same contract as today), decrements across grants in that locked order, and writes the corresponding `TokenTransaction` debit row.
- `getUserTokenBalance(userId)`: now just `SELECT SUM(remaining) WHERE remaining > 0 AND (expiresAt IS NULL OR expiresAt > now())` — cheap regardless of how much transaction history has accumulated.
**Test:** Write a temporary test route (or use Prisma Studio + manual `curl` calls) that: (a) credits 10,000 tokens expiring in 1 minute and 5,000 tokens expiring in 1 year, (b) waits for the first grant to expire, (c) confirms the balance correctly still shows 5,000, not 0 — this is the exact bug scenario from PRD §6.2.1, now fixed. Separately, fire two debit calls for the same user at effectively the same time (e.g. `Promise.all([debitTokens(...), debitTokens(...)])` in a scratch script) that together exceed the balance, and confirm exactly one succeeds and the other correctly fails rather than both succeeding and overdrawing.

### Step 0.3 — Migrate existing token-touching call sites to the canonical functions
**Goal:** Every place that currently writes `TokenTransaction` directly starts going through `creditTokens()`/`debitTokens()` instead, so there's exactly one code path that can move tokens.
**New files:** none
**Edited files:** `src/auth.ts` (OAuth welcome bonus, in `events.createUser`), `src/app/api/auth/verify/route.ts` (email-verification welcome bonus), `src/app/api/admin/tokens/adjust/route.ts` (admin credit/debit), `src/app/api/chats/[id]/messages/route.ts` (message debit), `src/app/api/chats/[id]/regenerate/route.ts` (regenerate debit)
**Test:** Re-run the existing manual flows for each: register a new account (welcome bonus via `creditTokens`, `expiresAt: null` or a sensible default — decide and document which), send a chat message (debit via `debitTokens`), have admin adjust a balance up and down. Confirm behavior is identical to before from the user's perspective, and that `TokenGrant` rows now exist correctly for each credit while `TokenTransaction` still shows the full history exactly as it did previously.

### Step 0.4 — Audit the JWT-specific NextAuth callbacks in `auth.config.ts`
**Goal:** Fix what would otherwise be a silent breakage the moment the session strategy changes in Step 0.5 — do this first, and separately, so it's easy to verify in isolation.
**New files:** none
**Edited files:** `src/auth.config.ts` — the `session({ session, token })` callback currently reads `token.id`/`token.role`, which only exist under `jwt` strategy. Under `database` strategy, NextAuth invokes this callback with `{ session, user }` instead (`user` being the full database record from the adapter) — change the callback to read `user.id`/`user.role`. The `jwt({ token, user })` callback simply stops being called under `database` strategy; remove it rather than leaving dead code that implies it still does something.
**Test:** This step alone shouldn't be tested against a live login yet (the strategy hasn't changed), but confirm the file still type-checks and the app still builds — the callback signature change is inert until Step 0.5 flips the strategy.

### Step 0.5 — Migrate session resolution off the adapter-less `proxy.ts` instance
**Goal:** Switch to `database` session strategy without breaking the two request paths in `proxy.ts` that currently depend on decoding a self-contained JWT cookie — this is more than a one-line config flip (PRD §6.9.3 has the full reasoning for why).
**New files:** possibly `src/lib/auth/resolve-session.ts` — **only if needed, see below**
**Edited files:** `src/auth.ts` (change `session: { strategy: 'jwt' }` → `session: { strategy: 'database' }`), `src/proxy.ts`
**New packages:** none
**New env vars:** none
**Test:** Do this in two parts, in order:
1. **Investigate first:** try having `proxy.ts` resolve sessions through the canonical, adapter-backed `auth` instance already exported from `src/auth.ts`, instead of the second, adapter-less `NextAuth(authConfig)` instance it currently builds for itself. The adapter-less instance exists today for edge-runtime safety, but Next.js 16 runs `proxy.ts` on the Node.js runtime by default (per `AGENTS.md`) — the constraint that justified the split may simply no longer apply. If the canonical instance resolves sessions correctly in both the page-protection branch (the bottom-of-file `nextAuthMiddleware(request)` call) and the API-route header-forwarding branch, use it directly in both places and delete the second instance and the `getToken()` fallback entirely. This is the better outcome if it works: one source of truth instead of two mechanisms that can drift apart.
2. **Only if that's genuinely not workable** (confirm and note *why*, not just "it didn't work on the first try"), implement `resolveSessionFromCookie()` in `src/lib/auth/resolve-session.ts` — a single helper that reads the session cookie and looks up `Session` (joined to `User`) directly via Prisma, filtered on `expires > now()`. Call this **one** helper from both branches in `proxy.ts` rather than writing the lookup twice.
Either way: log in via the web UI, confirm a real row appears in `Session` in Prisma Studio, confirm both page navigation (page-protection path) and an API call like `GET /api/tokens/balance` (header-forwarding path) correctly resolve the logged-in user. Log out, confirm the session row is removed and both paths correctly treat the request as unauthenticated. Confirm the **mobile Bearer-token flow** (`/api/auth/login`, the `Authorization: Bearer` branch in `proxy.ts`) is completely unaffected — it doesn't touch NextAuth sessions at all, and this step must not change its behavior.

### Step 0.6 — Remove the synthetic mock-session seeding
**Goal:** Stop `/api/settings/sessions` from writing fake rows into the real `Session` table now that real sessions exist.
**New files:** none
**Edited files:** `src/app/api/settings/sessions/route.ts` (delete the "seed mock sessions if empty" block; the table is genuinely populated now)
**Test:** Log in from two different browsers (or one normal + one incognito window). Call `GET /api/settings/sessions`, confirm exactly two real sessions are returned, both correctly flagged for `isCurrent` in their own context. Revoke "other sessions" via the existing `POST` endpoint and confirm the other browser gets logged out on its next request.

### Step 0.7 — Install and configure i18next
**Goal:** Stand up the i18n pipeline with zero visible UI change yet.
**New files:** `src/lib/i18n/config.ts`, `src/lib/i18n/client.ts`, `public/locales/en/common.json` (empty/minimal namespace to prove the pipeline works)
**Edited files:** `src/app/layout.tsx` (wrap children in the i18next provider)
**New packages:** `i18next`, `react-i18next`, `i18next-resources-to-backend`, `i18next-browser-languagedetector`
**New env vars:** none
**Test:** Add one test key to `common.json` (e.g. `"hello": "Hello"`), render it anywhere via `useTranslation()`, confirm it shows up. No visual regressions elsewhere.

### Step 0.8 — Pilot i18n extraction on one small surface
**Goal:** Prove the full extraction workflow (component → namespace → key) on a low-risk surface before doing the whole app.
**New files:** none
**Edited files:** `public/locales/en/auth.json` (new namespace), `src/components/auth/login-content.tsx` (replace hardcoded strings with `t()` calls)
**Test:** Login page renders identically to before. Toggle to a stub second locale folder (e.g. copy `en` → `fr` with one or two keys translated) and confirm switching language actually changes the login page text — proves the pipeline end-to-end even before you commit to translating the whole app.

### Step 0.9 — Add `NotificationPreference` model
**Goal:** Give the existing (unwired) notifications settings UI a real table to read/write.
**New files:** `prisma/migrations/<timestamp>_add_notification_preferences/migration.sql`
**Edited files:** `prisma/schema.prisma` (new `NotificationPreference` model: `userId`, `eventType` enum or string, `channel` enum [`email`,`sms`,`push`,`in_app`], `enabled` boolean; unique on `[userId, eventType, channel]`)
**Test:** Migrate, confirm table exists in Prisma Studio.

### Step 0.10 — Build `/api/settings/notifications` CRUD routes
**Goal:** Real backend for notification preferences.
**New files:** `src/app/api/settings/notifications/route.ts` (`GET` returns the user's preferences, seeding sensible defaults if none exist yet; `PATCH` upserts one or more preference rows)
**Edited files:** none yet (UI wiring is the next step)
**Test:** `GET` with an authenticated session/cookie returns a default preference set. `PATCH` with a body like `{ eventType: "welcome_email", channel: "email", enabled: false }` persists and is reflected on the next `GET`.

### Step 0.11 — Wire the notifications settings UI to the real API
**Goal:** Replace the dummy client-only state in the notifications page with real persistence.
**New files:** none
**Edited files:** `src/components/settings/notifications-client.tsx`
**Test:** Toggle a preference in the UI, refresh the page, confirm it persisted (reads from `/api/settings/notifications` on load).

### Step 0.12 — Build a generic `notify()` helper and refactor the verification email through it
**Goal:** Introduce the central notification abstraction described in PRD §6.4, without changing any user-visible behavior yet — this is a pure refactor, so it's low-risk and easy to verify.
**New files:** `src/lib/notifications/notify.ts` (the `notify(userId, eventType, variables)` entry point — for now it only knows how to send email via the existing Brevo setup, and checks `NotificationPreference` before sending), `src/lib/notifications/providers/email.ts` (wraps the existing Brevo logic currently inline in `lib/email.ts`)
**Edited files:** `src/lib/email.ts` (keep `sendVerificationEmail` as a thin wrapper calling `notify()`, or fold its logic into `providers/email.ts` and have `email.ts` re-export for backward compatibility), `src/app/api/auth/register/route.ts` (no change needed if `sendVerificationEmail`'s signature is preserved)
**Test:** Register a new test account, confirm the verification email still arrives exactly as before. This step should be invisible to the user — the only thing that changed is what's happening internally.

### Step 0.13 — Add in-app `Notification` model and list/read API
**Goal:** Backend for an in-app notification center (UI can come later; this proves the data layer).
**New files:** `prisma/migrations/<timestamp>_add_notifications/migration.sql`, `src/app/api/notifications/route.ts` (`GET` lists the user's notifications, paginated like `/api/tokens/history`), `src/app/api/notifications/[id]/read/route.ts` (`POST` marks one as read)
**Edited files:** `prisma/schema.prisma` (new `Notification` model: `userId`, `eventType`, `title`, `body`, `readAt DateTime?`, `createdAt`), `src/lib/notifications/notify.ts` (add an in-app "provider" that just inserts a row)
**Test:** Manually trigger `notify()` from a temporary test route or the registration flow, confirm a row appears via `GET /api/notifications`, mark it read, confirm `readAt` is set.

---

## PHASE 1 — Monetize

> Depends on Phase 0 steps 0.1–0.3 (the `TokenGrant`/`creditTokens`/`debitTokens` canonical spend path) and 0.9–0.11 (notifications, for payment-confirmation notices) being merged.

### Step 1.1 — Add `Plan`, `Subscription`, `PaymentTransaction` models
**Goal:** Real schema backing for plans/subscriptions/payments (PRD §6.3.2, §6.2.5).
**New files:** `prisma/migrations/<timestamp>_add_billing_models/migration.sql`
**Edited files:** `prisma/schema.prisma` (add the three models from PRD §4.3/§6.2.5, plus relations on `User`)
**Test:** Migrate, inspect in Prisma Studio.

### Step 1.2 — Seed the three plans
**Goal:** Get Lite/Standard/Pro into the database with real token amounts and USD/NGN prices.
**New files:** none
**Edited files:** `prisma/seed.ts` (add `db.plan.upsert(...)` calls)
**Test:** `npx prisma db seed`, confirm three `Plan` rows exist with the right `monthlyTokens`/`priceUsdCents`/`priceNgnKobo`.

### Step 1.3 — Add `country` and `currency` fields to `User`
**Goal:** Needed before payments can pick a provider/currency per user (PRD §6.9.5).
**New files:** `prisma/migrations/<timestamp>_add_user_country_currency/migration.sql`
**Edited files:** `prisma/schema.prisma` (`country String?`, `currency String?` on `User`), `src/app/api/settings/profile/route.ts` (extend the `PATCH` schema/handler to accept these fields)
**Test:** `PATCH /api/settings/profile` with `{ "country": "NG", "currency": "NGN" }`, confirm it persists and is returned.

### Step 1.4 — Add country selection to registration and profile UI
**Goal:** Let users actually set the fields from Step 1.3.
**New files:** none
**Edited files:** `src/components/auth/register-content.tsx` (country dropdown, NG/US to start, more later), `src/app/api/auth/register/route.ts` (accept and store `country`, default `currency` from it), `src/components/settings/profile-client.tsx` (editable country/currency)
**Test:** Register a new account selecting Nigeria, confirm `country`/`currency` are set correctly in the DB; same for US.

### Step 1.5 — Build `GET /api/plans` (public)
**Goal:** Expose plan data for the upgrade page to consume instead of hardcoded tiers.
**New files:** `src/app/api/plans/route.ts`
**Edited files:** none
**Test:** `curl localhost:3000/api/plans` (no auth needed — this is public pricing info) returns the three seeded plans.

### Step 1.6 — Install Stripe and add a checkout-session route (USD)
**Goal:** Real Stripe Checkout for USD subscribers.
**New files:** `src/lib/payments/stripe.ts` (Stripe client init), `src/app/api/payments/stripe/checkout/route.ts` (`POST`, takes a `planId`, creates a Stripe Checkout Session, returns the redirect URL)
**Edited files:** none
**New packages:** `stripe`
**New env vars:** `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
**Test:** Call the route with a valid `planId` while authenticated, confirm a real Stripe-hosted checkout URL comes back, and that opening it in a browser shows Stripe's test-mode checkout page for the right plan/price.

### Step 1.7 — Add Stripe webhook route with signature verification
**Goal:** Replace the old "trust the client" `/api/payments/confirm` pattern with a properly verified webhook, per PRD §6.3.1's top security fix.
**New files:** `src/app/api/payments/stripe/webhook/route.ts` (verifies `stripe-signature` header via `stripe.webhooks.constructEvent`, and on `checkout.session.completed` creates/updates a `Subscription` row, calls **`creditTokens()`** from Step 0.2 — not a raw `TokenTransaction.create` — with `type: "subscription"` and `expiresAt` set to the subscription's current period end so unused subscription tokens correctly expire with no rollover, and records a `PaymentTransaction`)
**Edited files:** none
**New env vars:** `STRIPE_WEBHOOK_SECRET`
**Test:** Use the Stripe CLI (`stripe listen --forward-to localhost:3000/api/payments/stripe/webhook`) to trigger a test `checkout.session.completed` event, confirm the user's token balance increases by the right amount and a `Subscription`/`PaymentTransaction` row is created. Confirm a request with a **tampered/missing** signature is rejected with 400 — this is the security property that matters most here.

### Step 1.8 — Add Paystack checkout-initialization route (NGN)
**Goal:** Real Paystack flow for Nigerian subscribers.
**New files:** `src/lib/payments/paystack.ts` (thin `fetch` wrapper around the Paystack REST API), `src/app/api/payments/paystack/checkout/route.ts` (`POST`, initializes a transaction, returns the Paystack authorization URL)
**Edited files:** none
**New env vars:** `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`
**Test:** Call the route, confirm a real Paystack test-mode authorization URL comes back and loads correctly in a browser.

### Step 1.9 — Add Paystack webhook route with HMAC verification
**Goal:** Same security property as Step 1.7, for Paystack.
**New files:** `src/app/api/payments/paystack/webhook/route.ts` (verifies the `x-paystack-signature` header using HMAC-SHA512 with `PAYSTACK_SECRET_KEY` via Node's built-in `crypto`, then on `charge.success` performs the same `creditTokens()` + Subscription/PaymentTransaction logic as Step 1.7 — top-up purchases here and via Stripe should both set `expiresAt` to one year out, per PRD §6.2.4)
**Edited files:** none
**Test:** Use Paystack's test webhook trigger (Dashboard → Webhooks → send test event) or `curl` a hand-signed payload, confirm valid signatures are accepted and processed, invalid ones are rejected with 400.

### Step 1.10 — Retire the old simulated payment routes
**Goal:** Remove the unverified credit-on-POST endpoint now that real ones exist.
**New files:** none
**Edited files:** `src/app/api/payments/checkout/route.ts` and `src/app/api/payments/confirm/route.ts` (delete both, or leave `checkout/route.ts` as a router that 302s to the correct provider-specific route based on the user's `currency`), `src/components/upgrade/checkout-client.tsx`, `src/components/upgrade/success-client.tsx` (point at the new provider-specific routes)
**Test:** Confirm the old routes no longer exist (404) or correctly redirect. Full upgrade flow works end-to-end for both a US-currency test user (Stripe) and an NG-currency test user (Paystack).

### Step 1.11 — Build real billing history
**Goal:** Replace the hardcoded invoice table on the billing page.
**New files:** `src/app/api/billing/history/route.ts` (`GET`, paginated, reads `PaymentTransaction`)
**Edited files:** `src/app/settings/billing/page.tsx` (fetch from the new route instead of the hardcoded `invoices` array; render the real active `Subscription` instead of the hardcoded "Pro Member Workspace" block)
**Test:** After completing a real test-mode payment in either provider, confirm it shows up correctly on `/settings/billing` with the right amount, currency, and status.

### Step 1.12 — Add a creator payout stub model and admin-visible balance
**Goal:** Lay groundwork for the $30/₦20,000 monthly payout decision without building the full payout pipeline yet (that's a larger, later effort — this step just makes the *number* visible and correct).
**New files:** `src/app/api/admin/creator-earnings/route.ts` (`GET`, admin-only, computes each creator's accrued revenue-share balance — even if the underlying revenue-share *calculation* is a placeholder formula for now, wire the shape end-to-end)
**Edited files:** none
**Test:** Confirm the route returns a list of creators with a computed balance and correctly flags which ones have crossed the $30/₦20,000 threshold.

---

## PHASE 2 — Differentiate Characters

> Depends on Phase 0 being merged. Independent of Phase 1.

### Step 2.1 — Add `language`, `voice` fields to `Character`
**Goal:** Smallest possible slice of PRD §6.1.1's customization table.
**New files:** `prisma/migrations/<timestamp>_add_character_language_voice/migration.sql`
**Edited files:** `prisma/schema.prisma` (`language String @default("en")`, `voice String?` on `Character`), `src/app/api/characters/route.ts` and `src/app/api/characters/[id]/route.ts` (accept the new optional fields in the Zod schemas)
**Test:** Create/update a character passing `language: "yo"`, confirm it persists.

### Step 2.2 — Add language/voice fields to the character form UI
**Goal:** Let creators actually set what Step 2.1 added.
**New files:** none
**Edited files:** `src/components/character-form.tsx` (new form fields; voice can be a simple text/select stub for now — full TTS voice picker is a later polish item)
**Test:** Create a character with a non-default language, confirm it round-trips through edit.

### Step 2.3 — Add `CharacterSetting` and `UserCharacterOverride` models
**Goal:** Schema for PRD §6.1.3's fixed-field override system.
**New files:** `prisma/migrations/<timestamp>_add_character_overrides/migration.sql`
**Edited files:** `prisma/schema.prisma` (both models as sketched in the PRD)
**Test:** Migrate, inspect in Prisma Studio.

### Step 2.4 — Build `/api/characters/[id]/settings` routes
**Goal:** Let a creator declare which fields (language/verbosity/formality/voice) are overridable.
**New files:** `src/app/api/characters/[id]/settings/route.ts` (`GET` returns current settings incl. defaults if unset; `PUT` — creator-only — updates `is_overridable` flags and defaults)
**Edited files:** none
**Test:** As the character's creator, `PUT` a setting toggling `language` to overridable, confirm `GET` reflects it. Confirm a non-creator gets 403.

### Step 2.5 — Build `/api/characters/[id]/overrides` routes
**Goal:** Let a 2nd-degree user set their own value for an overridable field.
**New files:** `src/app/api/characters/[id]/overrides/route.ts` (`GET` returns the current user's overrides for this character; `PUT` sets one, rejecting fields the creator hasn't marked overridable)
**Edited files:** none
**Test:** Attempt to override a non-overridable field → expect a clear error. Override an allowed field, confirm it persists and is scoped to that user only (a second test user has no override).

### Step 2.6 — Enable `pgvector` on the local Postgres instance
**Goal:** Infrastructure prerequisite for RAG.
**New files:** `prisma/migrations/<timestamp>_enable_pgvector/migration.sql` (raw `CREATE EXTENSION IF NOT EXISTS vector;`)
**Edited files:** none
**Test:** After migrating, run `SELECT * FROM pg_extension WHERE extname = 'vector';` via Prisma Studio's raw query tool or `psql`, confirm it's listed.

### Step 2.7 — Add `CharacterKnowledgeDocument` and `CharacterKnowledgeChunk` models
**Goal:** Schema for uploaded knowledge files and their chunks (embedding column added via raw SQL since Prisma doesn't model `vector` natively).
**New files:** `prisma/migrations/<timestamp>_add_knowledge_models/migration.sql` (Prisma-managed columns), followed immediately by a second raw migration `prisma/migrations/<timestamp>_add_chunk_embedding_column/migration.sql` (`ALTER TABLE "CharacterKnowledgeChunk" ADD COLUMN embedding vector(768);` — 768 dims matches Gemini's `text-embedding-004`/`gemini-embedding-001` output size; confirm against whichever embedding model you pick in Step 2.9 and adjust the dimension if different)
**Edited files:** `prisma/schema.prisma`
**Test:** Migrate both, confirm both tables exist and the `embedding` column shows as `vector` type.

### Step 2.8 — Extend upload route to accept raw (non-image) files
**Goal:** Let creators upload PDFs/DOCX/CSVs, not just avatar images.
**New files:** `src/app/api/characters/[id]/knowledge/route.ts` (`POST` — creator-only — accepts a file, validates type/size, uploads to Cloudinary with `resource_type: "raw"` under a `airacter/characters/knowledge/` folder, creates a `CharacterKnowledgeDocument` row with `status: "processing"`; `GET` lists a character's documents)
**Edited files:** none (leave the existing `/api/upload` route untouched — it stays image-only for avatars)
**New packages:** none yet
**Test:** Upload a small PDF as the character's creator, confirm a `CharacterKnowledgeDocument` row appears with the right Cloudinary URL and `status: "processing"`.

### Step 2.9 — Build text extraction for PDF/DOCX/CSV
**Goal:** Turn an uploaded file into plain text.
**New files:** `src/lib/knowledge/extract.ts` (dispatches by file type to the right library)
**Edited files:** none
**New packages:** `pdf-parse`, `mammoth`, `csv-parse`
**Test:** Write a small temporary test route or script that calls `extract()` on a sample PDF/DOCX/CSV from disk, log the output, confirm the text is sane (don't wire it into the real pipeline yet — that's the next step, kept separate so extraction bugs are isolated from embedding bugs).

### Step 2.10 — Build chunking + embedding pipeline
**Goal:** Turn extracted text into stored, embedded chunks.
**New files:** `src/lib/knowledge/chunk.ts` (simple fixed-size-with-overlap text splitter), `src/lib/knowledge/embed.ts` (calls the Gemini embedding model via the existing `@google/genai` client, then writes chunk rows including the `embedding` column via `db.$executeRaw`, since Prisma's typed client can't write `vector` columns directly)
**Edited files:** `src/app/api/characters/[id]/knowledge/route.ts` (after upload, kick off extraction → chunking → embedding, either inline for small files or via `after()` the same way `auto-titling.ts` already does background work in this codebase — reuse that established pattern rather than introducing a new one; update `status` to `"ready"` or `"failed"` when done)
**Test:** Upload a real knowledge file, poll `GET /api/characters/[id]/knowledge` until `status` flips to `"ready"`, confirm `CharacterKnowledgeChunk` rows exist with non-null embeddings in Prisma Studio (raw query, since Studio may not render the vector column nicely — a `SELECT count(*)` is enough to confirm).

### Step 2.11 — Build retrieval helper
**Goal:** Given a user message, fetch the most relevant chunks for a character.
**New files:** `src/lib/knowledge/retrieve.ts` (embeds the query text, runs a raw SQL cosine-similarity `ORDER BY embedding <=> $1 LIMIT N` query scoped to the character's chunks)
**Edited files:** none
**Test:** Write a temporary test route that calls `retrieve(characterId, "some question related to the uploaded doc")` and logs the top results — confirm the most relevant chunk genuinely looks relevant, not just returned because it's chunk #1.

### Step 2.12 — Wire retrieval into the chat message route
**Goal:** Make the character actually "know" its knowledge files during a real conversation.
**New files:** none
**Edited files:** `src/app/api/chats/[id]/messages/route.ts` (before calling `streamChatResponse`, if the character has any `status: "ready"` knowledge documents, call `retrieve()` and inject the top chunks into the system prompt or as additional context)
**Test:** Create a character, upload a knowledge file with a distinctive, made-up fact in it (something the model couldn't know otherwise), ask the character about that fact in a real chat, confirm the answer reflects the uploaded content. Also test a character with **no** knowledge files still behaves exactly as before (no regression, no wasted embedding calls).

### Step 2.13 — Add response version history (stop destructive regeneration)
**Goal:** Fix PRD §6.9.1 — keep old versions instead of deleting them.
**New files:** `prisma/migrations/<timestamp>_add_message_versions/migration.sql` (either a self-referential `parentMessageId` + `isActive` boolean on `Message`, or a separate `MessageVersion` table — the self-referential approach is less schema churn and fits the existing single-`Message`-per-turn model better)
**Edited files:** `prisma/schema.prisma`, `src/app/api/chats/[id]/regenerate/route.ts` (stop deleting; instead mark the previous assistant message inactive and insert the new one linked as a new version of the same turn), `src/app/api/chats/[id]/messages/route.ts` (only fetch `isActive` messages when building conversation history/context)
**Test:** Send a message, regenerate the response twice, confirm all three assistant versions still exist in the DB (`isActive` only on the latest), and that the chat history sent to Gemini for future turns only includes the active version, not all three.

### Step 2.14 — Add version-switcher UI
**Goal:** Let the user page back and forth between versions.
**New files:** none
**Edited files:** `src/components/chat/message-callout.tsx` (arrow controls when a message has more than one version, calling a new small `GET` endpoint or reusing data already fetched), possibly `src/app/api/chats/[id]/messages/route.ts` (`GET` returns version metadata alongside each active message)
**Test:** After Step 2.13's regenerations, confirm the arrows appear and let you browse all versions in the UI, with the "active" one being what's sent as context if you send a new message from there.

### Step 2.15 — Support multiple chat threads per character
**Goal:** Fix PRD §6.9.2 — stop forcing one chat per character.
**New files:** none
**Edited files:** `src/app/chats/page.tsx` (only auto-redirect into an existing chat if the user didn't explicitly ask for a new one — e.g. respect a `?new=true` param), `src/app/api/chats/route.ts` (no change needed — `POST` already creates a fresh chat; the bug is purely in the redirect-into-existing-chat logic upstream), UI entry point for "start a new chat with this character" (e.g. a button on `chat-sidebar.tsx` or the character card)
**Test:** Open an existing chat with a character, use the new "New chat" action, confirm a second, separate `Chat` row is created and both threads remain independently accessible from the sidebar.

---

## PHASE 3 — Distribution

> Depends on Phase 0. Independent of Phases 1–2, though richer replies (knowledge-grounded, paid characters) obviously benefit from having them done first.

### Step 3.1 — Add channel gateway types and `ChannelAccount` model
**Goal:** Common abstraction so Telegram/WhatsApp/Discord all plug into the same place.
**New files:** `prisma/migrations/<timestamp>_add_channel_account/migration.sql`, `src/lib/channels/types.ts` (a normalized `InboundMessage`/`OutboundMessage` shape and a `ChannelAdapter` interface)
**Edited files:** `prisma/schema.prisma` (`ChannelAccount`: `userId`, `channel` enum [`telegram`,`whatsapp`,`discord`], `externalId`, `linkedAt`)
**Test:** Migrate, confirm the table exists.

### Step 3.2 — Add an account-linking flow
**Goal:** Map an external Telegram/WhatsApp identity to an Airacter account before any bot logic exists (so linking can be tested in isolation).
**New files:** `src/app/api/channels/link/route.ts` (`POST`, authenticated — generates a short-lived linking code the user will send to the bot to prove ownership)
**Edited files:** none
**Test:** Call the route, confirm a code is returned and stored (e.g. in a short-TTL `ChannelLinkCode` table, or reuse the existing `VerificationToken` model's shape as a pattern) tied to the requesting user.

### Step 3.3 — Install Telegraf and add the Telegram webhook route (echo only)
**Goal:** Prove the webhook plumbing works before wiring it to any character logic.
**New files:** `src/lib/channels/telegram.ts` (bot instance setup), `src/app/api/channels/telegram/webhook/route.ts`
**Edited files:** none
**New packages:** `telegraf`
**New env vars:** `TELEGRAM_BOT_TOKEN`
**Test:** Register the bot with `@BotFather`, set the webhook (via Telegraf's `setWebhook` or a one-off script pointing at your local tunnel — e.g. `ngrok`), message the bot, confirm it echoes back exactly what you sent. No Airacter logic involved yet.

### Step 3.4 — Wire the linking code into the Telegram bot
**Goal:** Let a user prove ownership by sending their code to the bot.
**New files:** none
**Edited files:** `src/app/api/channels/telegram/webhook/route.ts` (if the incoming message matches a pending linking code, create the `ChannelAccount` row and reply with a confirmation instead of echoing)
**Test:** Generate a code via Step 3.2's route, send it to the bot, confirm a `ChannelAccount` row is created linking your Telegram user ID to your Airacter account, and the bot confirms success.

### Step 3.5 — Route linked-user messages to a default character chat
**Goal:** Make the bot actually useful — a linked user's messages go to (and get replies from) a chosen character.
**New files:** none
**Edited files:** `src/app/api/channels/telegram/webhook/route.ts` (look up the sender's `ChannelAccount`; if linked, find or create a `Chat` for a default/most-recently-used character, call the same message-handling logic used by `/api/chats/[id]/messages` — refactor the core "call Gemini, debit tokens, save message" logic out of that route into a shared `src/lib/chat/send-message.ts` helper so both the web route and the Telegram route call the same code rather than duplicating it)
**New files (revised):** `src/lib/chat/send-message.ts`
**Test:** As a linked user, send a real message to the bot, confirm you get a real character reply, and that a `Message` row + token debit both appear correctly, identical in shape to a web-originated chat.

### Step 3.6 — Add WhatsApp webhook verification handshake
**Goal:** Satisfy Meta's required `GET` verification challenge before any messages can flow.
**New files:** `src/app/api/channels/whatsapp/webhook/route.ts` (`GET` responds to Meta's `hub.challenge` handshake using `WHATSAPP_VERIFY_TOKEN`)
**Edited files:** none
**New env vars:** `WHATSAPP_VERIFY_TOKEN`
**Test:** Enter your webhook URL + verify token in the Meta App Dashboard's WhatsApp webhook config, confirm Meta reports the handshake as successful.

### Step 3.7 — Handle inbound WhatsApp messages (echo only)
**Goal:** Same "prove plumbing first" approach as Step 3.3.
**New files:** `src/lib/channels/whatsapp.ts` (thin `fetch` wrapper for the Graph API's send-message endpoint, plus payload signature verification using `WHATSAPP_APP_SECRET`)
**Edited files:** `src/app/api/channels/whatsapp/webhook/route.ts` (add `POST` handling)
**New env vars:** `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`
**Test:** Send a WhatsApp message to your test business number, confirm it's echoed back. Flag: this step requires a Meta-provided test number, which is available for free during development but production senders require Business verification — budget review time separately from the coding time.

### Step 3.8 — Wire WhatsApp into the shared account-linking + chat-send logic
**Goal:** Reuse Steps 3.2/3.4/3.5's patterns for WhatsApp instead of building parallel logic.
**New files:** none
**Edited files:** `src/app/api/channels/whatsapp/webhook/route.ts` (same linking-code-first, then route-to-`send-message.ts` logic as Telegram)
**Test:** Same as Step 3.5, over WhatsApp instead of Telegram.

---

## PHASE 4 — Community (Step 1: Topic Rooms + Resident Bots)

> Depends on Phase 0. Benefits from Phase 2's RAG work for richer Resident Bot replies, but doesn't strictly require it.

### Step 4.1 — Add `Room` and `RoomMessage` models
**Goal:** Schema for the smallest viable version — human chat in a room, no bot yet.
**New files:** `prisma/migrations/<timestamp>_add_rooms/migration.sql`
**Edited files:** `prisma/schema.prisma` (`Room`: `slug`, `name`, `description`; `RoomMessage`: `roomId`, `userId`, `content`, `createdAt`)
**Test:** Migrate, confirm tables exist.

### Step 4.2 — Build room list/create admin routes
**Goal:** Admin can stand up "The Tech Hub" etc. — rooms are admin-seeded, not user-created, for this phase.
**New files:** `src/app/api/admin/rooms/route.ts` (`GET` list, `POST` create, admin-only)
**Edited files:** none
**Test:** As admin, create a room, confirm it's listed. As a non-admin, confirm 403.

### Step 4.3 — Build room messaging routes (human-only, no bot)
**Goal:** Prove basic room chat works before adding any AI complexity.
**New files:** `src/app/api/rooms/route.ts` (`GET`, public list of rooms), `src/app/api/rooms/[id]/messages/route.ts` (`GET` history, `POST` post a message — any authenticated user)
**Edited files:** none
**Test:** Two different test users post messages to the same room, confirm both see each other's messages via `GET`.

### Step 4.4 — Add basic content moderation on room message post
**Goal:** Per PRD §6.5, moderation from day one, even before any bot exists.
**New files:** `src/lib/moderation/perspective.ts` (calls Google's Perspective API), or a simpler keyword-filter fallback if you'd rather not add the API key yet
**Edited files:** `src/app/api/rooms/[id]/messages/route.ts` (reject or flag messages above a toxicity threshold before persisting)
**New env vars:** `PERSPECTIVE_API_KEY` (optional — the keyword-filter fallback needs none)
**Test:** Post an obviously offensive test message, confirm it's rejected or flagged; post a normal message, confirm it goes through unaffected.

### Step 4.5 — Assign a Resident Bot character to a room
**Goal:** Link an existing `Character` to a `Room` as its expert/moderator.
**New files:** none
**Edited files:** `prisma/schema.prisma` (add `residentCharacterId String?` to `Room`), new migration, `src/app/api/admin/rooms/route.ts` (accept it on create/update)
**Test:** Assign a character to a room via the admin route, confirm it's stored and returned on `GET /api/rooms`.

### Step 4.6 — Add mention detection with a debounce queue
**Goal:** Implement PRD §6.5's critical cost-safety guardrail — batch mentions instead of firing one Gemini call per `@mention`.
**New files:** `prisma/migrations/<timestamp>_add_room_bot_jobs/migration.sql` (a `RoomBotJob` table: `roomId`, `windowStart`, `status` [`pending`,`processing`,`done`], created/updated timestamps), `src/app/api/rooms/[id]/messages/route.ts` — updated to, on detecting an `@mention` of the room's resident character, upsert a `pending` `RoomBotJob` for a debounce window (e.g. 20 seconds) rather than immediately generating a reply
**Edited files:** `prisma/schema.prisma`
**Test:** Post several messages mentioning the bot within a few seconds of each other, confirm only **one** `RoomBotJob` row is created/updated for that window, not one per mention.

### Step 4.7 — Build the debounce worker
**Goal:** Actually process pending jobs once their window elapses and post the bot's reply.
**New files:** `src/app/api/cron/process-room-bot-jobs/route.ts` (protected by checking a `CRON_SECRET` header/query param; finds `pending` jobs whose window has elapsed, gathers the room's recent context, calls the shared `send-message.ts`-style logic against the resident character, posts the reply as a `RoomMessage` from the bot, marks the job `done`)
**Edited files:** none
**New env vars:** `CRON_SECRET`
**Test:** Locally, hit the cron route manually after the debounce window has passed, confirm the bot posts a single contextual reply covering all the batched mentions. In production this route would be triggered by Vercel Cron (or an equivalent scheduler) roughly every 10–15 seconds; for local dev, a simple `node-cron` script or manual polling is enough — don't add scheduling infrastructure prematurely.

### Step 4.8 — Add room message reporting (reuse the `CharacterReport` pattern)
**Goal:** Extend moderation to reportable room content, mirroring the existing character-report/admin-resolve flow rather than inventing a new one.
**New files:** `prisma/migrations/<timestamp>_add_room_message_reports/migration.sql`, `src/app/api/rooms/[id]/messages/[messageId]/report/route.ts` (`POST`)
**Edited files:** `prisma/schema.prisma` (`RoomMessageReport`, shaped like `CharacterReport`), `src/app/api/admin/queue/route.ts` (surface pending room-message reports alongside existing character reports, or add a parallel `src/app/api/admin/room-reports/route.ts` if you'd rather keep the queues separate)
**Test:** Report a room message as a test user, confirm it shows up in the admin queue, and that admin resolve/dismiss actions work the same way they already do for characters.

---

## PHASE 5 — Trust & Admin

> Depends on Phase 0 (session strategy, notifications) and benefits from Phase 1 (payout dashboard needs `PaymentTransaction`).

### Step 5.1 — Relabel the admin "Pending Reviews" UI
**Goal:** Lowest-risk possible first step of this phase — pure copy change reflecting PRD §6.8's finding that characters are already live, not gated.
**New files:** none
**Edited files:** `src/components/admin/admin-client.tsx` (rename the tab/section and add explanatory copy)
**Test:** Visual check only — admin panel still functions identically, just reads correctly now.

### Step 5.2 — Build the token/cost-monitoring dashboard API
**Goal:** Give visibility into Gemini spend vs. revenue — a genuine blind spot today per PRD §7.
**New files:** `src/app/api/admin/metrics/route.ts` (`GET`, admin-only — aggregates `TokenTransaction` debits over time buckets, alongside `PaymentTransaction` revenue if Phase 1 is merged)
**Edited files:** none
**Test:** Confirm the route returns sensible daily/weekly aggregates against your test data.

### Step 5.3 — Build the admin audit log
**Goal:** Record who did what, for accountability on takedowns/adjustments.
**New files:** `prisma/migrations/<timestamp>_add_admin_audit_log/migration.sql`, `src/lib/admin/audit.ts` (a small `logAdminAction()` helper)
**Edited files:** `prisma/schema.prisma` (`AdminAuditLog`: `adminUserId`, `action`, `targetType`, `targetId`, `metadata Json`, `createdAt`), `src/app/api/admin/characters/review/route.ts` and `src/app/api/admin/tokens/adjust/route.ts` (call `logAdminAction()` after their existing actions succeed)
**Test:** Perform an admin action (e.g. reject a character), confirm an `AdminAuditLog` row is created with the right admin, action, and target.

### Step 5.4 — Build the bulk notification trigger
**Goal:** Reuse Phase 0's `notify()` for admin-initiated broadcasts.
**New files:** `src/app/api/admin/notifications/broadcast/route.ts` (`POST`, admin-only — takes a target segment (e.g. "all users", "free tier only") and an event type/template, queues a `notify()` call per matching user)
**Edited files:** none
**Test:** Broadcast to a small test segment, confirm each matching user gets an in-app `Notification` row (and email, if that channel is enabled for them).

### Step 5.5 — Build support ticket model and routes
**Goal:** Backend for PRD §6.9.5's contact form + visible ticket status.
**New files:** `prisma/migrations/<timestamp>_add_support_tickets/migration.sql`, `src/app/api/support/route.ts` (`POST` create a ticket — authenticated or with an email field for logged-out visitors; `GET` — the current user's own tickets), `src/app/api/admin/support/route.ts` (`GET` all tickets, `PATCH` update status/reply — admin-only)
**Edited files:** `prisma/schema.prisma` (`SupportTicket`: `userId?`, `email`, `subject`, `body`, `status` [`open`,`in_progress`,`resolved`], `adminReply?`, timestamps)
**Test:** Submit a ticket, confirm it appears both for the submitting user and in the admin list; admin replies and changes status; confirm the user sees the updated status/reply on their own `GET`.

### Step 5.6 — Wire the support page and FAQ
**Goal:** Real UI on top of Step 5.5.
**New files:** `src/app/support/page.tsx`, `src/components/support/support-form.tsx`, `src/components/support/faq-section.tsx` (static content to start)
**Edited files:** none
**Test:** Full round trip through the UI: submit a ticket, see it listed with "open" status, confirm status updates once an admin (via Prisma Studio or the admin route) marks it resolved.

### Step 5.7 — Install `otplib`/`qrcode` and add `TwoFactorSecret` model
**Goal:** Schema + setup flow for TOTP 2FA.
**New files:** `prisma/migrations/<timestamp>_add_two_factor_secret/migration.sql`, `src/lib/security/totp.ts` (generate/verify TOTP codes, encrypt/decrypt the stored secret using `TOTP_ENCRYPTION_KEY`), `src/app/api/settings/2fa/setup/route.ts` (`POST` — generates a secret + QR code data URL, stores it un-confirmed), `src/app/api/settings/2fa/confirm/route.ts` (`POST` — verifies the first code and flips the secret to confirmed/active)
**Edited files:** `prisma/schema.prisma` (`TwoFactorSecret`: `userId`, `encryptedSecret`, `backupCodesHash String[]`, `confirmedAt DateTime?`)
**New packages:** `otplib`, `qrcode`
**New env vars:** `TOTP_ENCRYPTION_KEY`
**Test:** Call setup, scan the returned QR code with an authenticator app, submit the current 6-digit code to confirm, verify `confirmedAt` gets set.

### Step 5.8 — Add the 2FA challenge to the web login flow
**Goal:** Actually enforce it during Credentials sign-in.
**New files:** none
**Edited files:** `src/auth.ts` (in the `Credentials` provider's `authorize()`, after password verification succeeds, if the user has a confirmed `TwoFactorSecret`, require an additional `totpCode` field and verify it before returning the user)
**Test:** With 2FA enabled on a test account, confirm login fails without a valid TOTP code and succeeds with one. Confirm an account **without** 2FA enabled logs in exactly as before (no regression).

### Step 5.9 — Add the 2FA challenge to the mobile Bearer-token login route
**Goal:** Close the gap noted in PRD §6.9.4 — don't leave the mobile flow as a bypass.
**New files:** none
**Edited files:** `src/app/api/auth/login/route.ts` (same challenge logic as Step 5.8, adapted to this route's request/response shape — likely a two-step flow: first call returns a "2FA required" response instead of the token, a second call with the code returns the token)
**Test:** Same as Step 5.8, but hitting `/api/auth/login` directly (e.g. via `curl`/Postman) instead of the web UI.

### Step 5.10 — Add 2FA disable + backup codes
**Goal:** Round out the feature — recovery path matters as much as setup.
**New files:** `src/app/api/settings/2fa/disable/route.ts` (`POST`, requires password + current TOTP code), `src/app/api/settings/2fa/backup-codes/route.ts` (`POST` regenerates a fresh set)
**Edited files:** none
**Test:** Disable 2FA, confirm login no longer requires a code. Regenerate backup codes, confirm the old ones stop working and a new set does.

### Step 5.11 — Wire the security settings UI to all of the above
**Goal:** Replace the dummy `security-client.tsx` state with the real setup/disable/session flows.
**New files:** none
**Edited files:** `src/components/settings/security-client.tsx`
**Test:** Full manual walkthrough: enable 2FA (see real QR code), confirm it, log out, log back in with a code, view active sessions (now real, from Phase 0), revoke one, disable 2FA.

---

## PHASE 6 — Scale-Outs

Per the PRD, this phase is intentionally deferred and not part of the near-term build — it's listed here only so the phase numbering stays consistent with the PRD. When you're ready to plan it in the same small-step format as above, it would cover: extracting the admin panel to its own deployable, extracting the notification worker, extracting the channel gateway, standing up `api.airacter.com` for third-party developer access, and adding voice/TTS. None of this should be scoped into granular steps until Phases 0–5 are live and you have a concrete trigger (real usage/perf data, or a specific external integration request) motivating the split — scoping it earlier risks over-engineering against guesses.

---

*End of implementation guide.*
