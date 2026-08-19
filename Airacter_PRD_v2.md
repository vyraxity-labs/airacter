# Airacter — Product Requirements Document (PRD)

**Version:** 1.0
**Date:** August 15, 2026
**Owner:** [Founder / Solo Developer]
**Status:** Draft for build planning

---

## 1. Product Vision

Airacter is a persona-driven AI chat platform, built for a global audience but rooted in Nigeria/Africa as the primary market. Its differentiator is not "chat with AI" — that's commoditized — but **regionally and domain-grounded characters that feel like distinct experts**, created by a community of users, distributed through the channels Africans already use (WhatsApp, Telegram, USSD), and priced in a way that reflects local purchasing power.

**Core hypothesis:** a Nigerian SME owner will pay more readily for "AI Tax Officer that knows FIRS" delivered over WhatsApp than for a generic chatbot in a new app.

---

## 2. Goals for This Iteration

1. Turn dummy/hardcoded subsystems (billing, notifications, admin, security) into real, working systems.
2. Make characters genuinely customizable and regionally grounded, without requiring actual model fine-tuning.
3. Stand up a real, multi-currency payment and subscription system, launching with Nigeria (NGN) and the US (USD).
4. Ship a low-risk, incremental path to "community," instead of building a public microblog on day one.
5. Internationalize the **app UI** (not character language) early, since it's a foundational dependency for other UI work.
6. Keep the codebase a single deployable monolith for now, modularized internally so pieces can be split out later without a rewrite.

**Explicit non-goals for this iteration:** public microblog with arbitrary user-to-user posting, hardware-key 2FA, USSD chat access, true per-character model fine-tuning.

---

## 3. Users

| Role | Definition | Notes |
|---|---|---|
| **Creator** | Creates and configures characters | Not a distinct account type — any user can act as a creator |
| **Consumer** | Chats with characters created by others (or their own) | Same account type as Creator |
| **Admin** | Platform operator | Internal only, separate auth surface, enforced via `Role` enum in the `User` model |

Every user is just a `User`; "creator-ness" is derived from `count(characters where owner_id = user.id) > 0`, not stored as a role or flag. Permission checks should follow the same logic (ownership-based, not role-based) — this already matches how the codebase's character/chat routes check `createdBy === userId` today.

---

## 4. Confirmed Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19.2 | Uses `src/proxy.ts` in place of `middleware.ts` — a Next.js 16 convention |
| Language | TypeScript, strict mode | — |
| Styling | Tailwind CSS v4 + shadcn/ui (`base-nova` style) | Custom design-token system in `globals.css` (surface/on-surface/tertiary tokens), light/dark via CSS vars |
| Database | PostgreSQL 16 (Docker Compose for local dev) | — |
| ORM | Prisma 7 (`@prisma/client` + `@prisma/adapter-pg`) | Schema at `prisma/schema.prisma` |
| Auth | NextAuth v5 (beta) — Credentials + Google OAuth | Currently JWT session strategy (changing — see §6.9.3); custom JWT bearer-token flow also exists (`lib/jwt.ts`, `/api/auth/login`) for a **mobile client**, forwarded via `x-user-id`/`x-user-role` headers set in `proxy.ts` |
| AI provider | Google Gemini only, via `@google/genai` in `lib/ai-gateway.ts` | Single-provider today; streaming responses via SSE |
| State | Zustand (`providers/store.tsx`) | — |
| Image hosting | Cloudinary | Configured for character avatars (`/api/upload`), 5MB limit, images only |
| Email | Brevo (`@getbrevo/brevo`) | Only one email currently wired: verification email (`lib/email.ts`) |
| Validation | Zod | Used consistently across all API routes — keep this pattern for new endpoints |

---

## 5. Scope & Phasing

| Phase | Theme | Key deliverables |
|---|---|---|
| **Phase 0** | Foundations | i18next setup, database session strategy migration, token-expiry schema change, notification service refactor |
| **Phase 1** | Monetize | Real payments (Paystack for NGN + Stripe for USD), real subscriptions, real billing history, webhook-verified token crediting |
| **Phase 2** | Differentiate characters | Knowledge-file grounding via RAG (pgvector), fixed-field 2nd-degree overrides, language/voice fields |
| **Phase 3** | Distribution | Telegram bot bridge → WhatsApp Business API bridge |
| **Phase 4** | Community (step 1) | Topic Rooms + Resident Bots, reusing existing `CharacterReport` moderation flow |
| **Phase 5** | Trust & Admin | Admin feature expansion, verification-queue relabeling, TOTP 2FA, real session management |
| **Phase 6** | Scale-outs | Subdomain separation, voice, further channel integrations, microblog v2 |

Resist building Phase 2–4 before Phase 1 is solid — token economics and payments are the hardest things to retrofit once real users and real money are involved, and today `/api/payments/confirm` has **no payment verification at all** (it credits tokens directly from an unverified POST body). No real money currently flows through the app, which gives room to land this properly before Phase 1 goes live rather than as an emergency fix.

---

## 6. Functional Requirements

### 6.1 Character / Persona Customization

#### 6.1.1 Customization dimensions

| Dimension | Description | Status |
|---|---|---|
| Name, avatar, tagline, system prompt | Existing | Built |
| **Personality profile (tone)** | `tone: String[]` from a fixed option list (Casual, Formal, Humorous, Stoic, Empathetic, Dramatic) | Built |
| Category | Fixed enum (education, productivity, entertainment, wellness, creative, technical, fun, other) | Built |
| **Domain/region tags** | e.g. `country: NG`, `regulatory-body: FIRS` | Not built — new field |
| **Knowledge grounding (RAG)** | Uploaded documents retrieved at chat time | Not built — see §6.1.2 |
| **Default language** | Character's default reply language | Not built — new field |
| **Voice (TTS)** | Voice selection for read-aloud | Not built — new field |
| **Visibility & access** | Currently `private`/`public` only | Needs extension for paid characters (§6.2.5) |
| **Overridable fields** | Which settings a 2nd-degree user may change per-session | Not built — see §6.1.3 |

#### 6.1.2 Knowledge grounding — RAG, not fine-tuning

Actually fine-tuning a hosted model like Gemini per character is expensive, slow, and unnecessary for the stated goal (the character should "know" the uploaded material, not require retrained weights). **Use Retrieval-Augmented Generation instead:**

1. On upload, extract text from the file → chunk it → generate embeddings → store in a vector index.
2. At chat time, embed the user's message, retrieve the top-N relevant chunks for that character's document set, and inject them into the context window alongside the system prompt.

This project's Postgres instance can host **pgvector** directly (no new vector database vendor). Add the extension, add an `embedding vector(N)` column via a raw SQL migration (Prisma's schema syntax doesn't model vector types, so this one table needs a manual migration alongside Prisma-managed ones), and query it from a small retrieval helper in `lib/`.

For document storage, Cloudinary — already integrated — supports `resource_type: "raw"` uploads for non-image files, so the existing `/api/upload` pattern can be extended rather than introducing a second storage vendor.

Suggested additive schema:

```prisma
model CharacterKnowledgeDocument {
  id          String   @id @default(cuid())
  characterId String
  fileName    String
  fileUrl     String   // Cloudinary raw resource URL
  status      String   @default("processing") // processing | ready | failed
  createdAt   DateTime @default(now())

  character Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  chunks    CharacterKnowledgeChunk[]
}

// embedding column added via raw SQL migration (pgvector type isn't expressible in Prisma schema syntax)
model CharacterKnowledgeChunk {
  id         String  @id @default(cuid())
  documentId String
  content    String  @db.Text
  // embedding vector(1536)  <- added via raw migration

  document CharacterKnowledgeDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
}
```

This should be described to users as **"Knowledge Files"** or **"Character Memory,"** not "fine-tuning."

This approach also directly serves multi-provider support: RAG is provider-agnostic, unlike fine-tuning, so it works whether the underlying model is Gemini today or OpenAI/Claude later.

#### 6.1.3 2nd-degree overridable settings

Rather than letting 2nd-degree users override arbitrary character fields (large engineering surface, risk of users breaking a character's intended behavior), define a **fixed, curated list of override-able fields** at the platform level — language, verbosity, formality, voice. For each character, the creator toggles which of these fields a consumer may override.

`Character` currently has no `language`, `voice`, or per-field override metadata — these are new columns/tables, not present today:

```
character_settings (per character)
 ├─ field: "language" | "verbosity" | "formality" | "voice"
 ├─ default_value
 └─ is_overridable: boolean

user_character_overrides (per user, per character)
 ├─ field
 └─ value
```

At chat time: `effective_value = user_character_overrides.value if is_overridable and override exists, else character_settings.default_value`.

#### 6.1.4 Sensitive-domain characters

Characters in health, legal, financial, or mental-health domains warrant a platform-level policy layer regardless of what the creator's system prompt says (no medical diagnosis, no dosage/medication guidance, crisis-resource fallback for self-harm signals, age gating). Whether these categories require mandatory admin review even without general pre-approval is **deferred to a later pass** — not yet decided.

Given health-adjacent characters may handle sensitive personal data, review Nigeria Data Protection Act (NDPR) obligations — data residency, consent, breach-notification — before these categories go live.

---

### 6.2 Plans, Subscriptions & Tokens

#### 6.2.1 Token ledger — current state and the expiry gap

`TokenTransaction` is already a genuine, working ledger (`credit_welcome`, `credit_purchase`, `debit_message`, `credit_admin`, `debit_refund`, each with `direction` and `metadata`). Welcome tokens are credited on both email-verified signup and Google OAuth signup. Message costs are computed from **real Gemini token counts** (`countTokens` in `lib/ai-gateway.ts`), not estimated. Admin can manually credit/debit via `/api/admin/tokens/adjust` with balance-sufficiency checks on debits.

**What's missing is expiry.** Every credit is currently a permanent addition to the running balance, which blocks the "subscription tokens expire monthly, no rollover" and "purchased top-ups expire after 1 year" requirements.

**Decision: add a nullable `expiresAt` field to `TokenTransaction`, and filter expired credits out of the balance query** (`WHERE expiresAt IS NULL OR expiresAt > now()`). This was chosen over a full wallet-bucket accounting model (a separate `TokenGrant` table tracking exactly which grant funded which message) because it's a small, additive migration and a small change to one query function, and it satisfies both requirements without needing FIFO consumption tracking. Precise "which grant funded which message" auditability can be revisited later if it becomes genuinely necessary.

#### 6.2.2 Free tier & character creation

Every account gets a small monthly free token allowance. **Character creation is free** — only chatting (message generation) consumes tokens. This avoids the awkward case of a creator needing tokens just to test their own character while building it, and lets free-tier creators still grow the catalog.

#### 6.2.3 Tiered subscriptions

Three paid tiers — Lite, Standard, Pro — in addition to the free tier. More tiers mostly confuse users; fewer doesn't segment willingness-to-pay well.

No rollover on subscription tokens is standard SaaS practice and creates renewal urgency. A future retention lever worth considering (not required for launch): a small rollover cap (e.g. up to 20% of monthly allowance) for Standard/Pro tiers only.

#### 6.2.4 Purchasable top-up tokens

Available to paid subscribers only (not free tier, to avoid top-ups becoming a way to permanently avoid subscribing), expiring one year from purchase per §6.2.1's `expiresAt` mechanism.

#### 6.2.5 Creator incentive model — combined approach

- **Free characters:** creator earns a revenue share from platform subscription revenue, weighted by that character's usage share among subscribed users.
- **Paid characters:** creator sets a price (subject to a platform-defined minimum, since token economics set a cost floor); platform takes a cut, the rest goes to the creator. This requires extending `Character.visibility` beyond `private`/`public` to represent paid access.

**Creator payout: minimum threshold $30 USD / ₦20,000, paid monthly.**

Required alongside this:
- **Anti-fraud:** exclude creator-owner chat sessions from revenue-share calculations; watch for coordinated usage inflation.
- **Payout KYC:** identity verification before first payout — a compliance requirement, not just good practice, once real money is being sent to individuals.
- **Published formula:** creators should be able to see how their cut is calculated, not treat it as a black box.

Suggested additive schema (shared with §6.3):

```prisma
model PaymentTransaction {
  id             String   @id @default(cuid())
  userId         String
  provider       String   // "paystack" | "stripe"
  providerRef    String   @unique
  amount         Int      // minor units
  currency       String   // "NGN" | "USD"
  purpose        String   // "subscription" | "topup" | "character_payment" | "creator_payout"
  status         String   // "pending" | "success" | "failed"
  createdAt      DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### 6.2.6 Ads — deprioritized

Ad networks (including Google Ad Manager) can technically serve ads on authenticated pages, but AdSense's content-policy scrutiny is a poor fit for AI-chat/UGC content, ad revenue at early scale will be negligible next to subscription/creator revenue, and ads next to a paid "expert" character undermines the premium positioning. Skip for v1; revisit "limited ads, free-tier only" as a later experiment if needed.

---

### 6.3 Payments & Billing

#### 6.3.1 Providers — Phase 1: Nigeria and the US only

`/api/payments/checkout` currently just returns a redirect URL, and `/api/payments/confirm` directly credits tokens on POST with no payment verification — anyone able to call the authenticated endpoint can grant themselves tokens today. This is acceptable for the current internal/demo state (no real money flows through the app yet) but **must not ship to production as-is.**

**Phase 1 currency scope is Nigeria (NGN) and the US (USD) only**, which narrows the provider decision to:
- **Paystack** for NGN — native Naira support, bank transfer, USSD-as-payment-rail, strong local docs.
- **Stripe** for USD — card payments plus Apple Pay/Google Pay wallets out of the box.

Flutterwave's broader pan-African coverage (Ghana, Kenya, mobile money) can wait until Phase 1's currency scope expands beyond NGN/USD.

`/api/payments/confirm` needs to become a **webhook-verified** endpoint — Paystack and Stripe both sign their webhook payloads; verify the signature server-side before crediting anything, replacing the current "trust the client's POST body" implementation. This is the highest-priority security fix in the payments area, to land before Phase 1 goes live.

#### 6.3.2 New data model

There is currently no `Plan`, `Subscription`, `Invoice`, or `Currency` model in the schema — the billing page renders a fully hardcoded plan and invoice rows. Minimum viable additions:

```prisma
model Plan {
  id            String  @id @default(cuid())
  key           String  @unique // "lite" | "standard" | "pro"
  monthlyTokens Int
  priceUsdCents Int
  priceNgnKobo  Int?    // null = compute from FX rate at checkout time
}

model Subscription {
  id               String   @id @default(cuid())
  userId           String
  planId           String
  status           String   // active | canceled | past_due
  currentPeriodEnd DateTime
  createdAt        DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan Plan @relation(fields: [planId], references: [id])
}
```

(`PaymentTransaction` is shared with §6.2.5 above.)

#### 6.3.3 Regional pricing

PPP-adjusted regional pricing is standard practice (Spotify, Netflix, Notion). Two things to get right: base Naira pricing off willingness-to-pay research and the Gemini cost basis (not just a flat discount off the USD price — every tier must still clear the cost floor per message regardless of what currency the user pays in); and tie regional-price eligibility to the payment method's issuing country rather than a self-reported profile field, to reduce (not necessarily eliminate) arbitrage.

#### 6.3.4 Billing history

Replace the hardcoded invoice rows on `/settings/billing` with real reads from `PaymentTransaction` — this becomes the single source of truth for both the user-facing billing page and any admin financial views.

---

### 6.4 Notifications

Build a generic, multi-channel notification service now rather than bolt on SMS/push later — this is expensive to retrofit. `lib/email.ts` currently only exports `sendVerificationEmail`, and there's no notification-preferences model in the schema.

**Architecture:**
- A central `NotificationService` with one entry point: `notify(user_id, event_type, channel_preferences, template, variables)`.
- Per-channel providers behind a common interface. For email, **the project already uses Brevo** (`@getbrevo/brevo`) — which supports transactional templates, batch sending, *and* has its own SMS API. Check Brevo's SMS coverage/pricing for Nigeria before adding a second vendor (e.g. Termii/Africa's Talking) purely for SMS; consolidating on one vendor already paid for is worth a real comparison first.
- Push (Firebase Cloud Messaging, for when mobile apps exist) and in-app (a `notifications` table with read/unread state) round out the channel set.
- Templates in code (React Email or similar) rather than a third-party template CMS — testable, versionable, no extra vendor dependency.
- Batch sends go through a queue (a simple DB-backed job queue is sufficient at this scale) so bulk admin broadcasts don't block request threads or hit provider rate limits.
- A `notification_preferences(user_id, event_type, channel, enabled)` table backs the currently-unwired settings UI.

---

### 6.5 Interactive Community

Build incrementally, starting with **Topic Rooms + Resident Bots** rather than a full public microblog: dedicated public channels (e.g. "The Tech Hub," "The Agri-Forum"), with specific AI personas assigned to live in them as moderators/experts, where real users can tag `@ExpertAI` and the bot reads conversational context via Gemini's context window before replying. Expand toward the full microblog concept later, once this is proven and cost-safe.

This sequencing directly addresses the identified risk: 1,000 simultaneous @mentions crashing the backend and spiking the Gemini bill.

Guardrails for even the Topic Rooms version:
- **Debounce mentions** — batch mentions within a room over a short window (10–30s) and have the Resident Bot respond once to the batched context, rather than firing one Gemini call per mention.
- **Per-room and per-user rate limits** on bot invocations, independent of the general token system.
- **Queue bot responses** — a short "thinking..." state while a queued worker generates the reply is an acceptable UX trade for cost control.
- **Moderation from day one**, even for human-only room chat: the existing `CharacterReport` model and admin resolve/dismiss flow is directly reusable as the moderation backbone here, so this is less net-new work than it might appear — pair it with an off-the-shelf content-moderation API call for a first pass filter (profanity/spam/hate-speech), rather than building a custom classifier.

---

### 6.6 App Localization (i18n)

No `i18next` or `next-intl` package currently exists in `package.json` — this is a clean-slate implementation, not a migration. **`react-i18next`** is a solid, standard choice for a React app.

- Split translation JSON files by feature/namespace (`auth.json`, `chat.json`, `billing.json`, `admin.json`) rather than one giant file.
- Do this **before** most other UI work — retrofitting i18n onto already-written components (extracting every hardcoded string after the fact) is one of the more tedious frontend refactors, so front-loading it avoids that cost.

---

### 6.7 API Keys & External Integrations

`/api/settings/keys` today generates a real 30-day signed JWT for **pairing a mobile app to the account** (consumed by the Bearer-token path in `proxy.ts`) — this is a working feature, not a placeholder, but it is a different concept from third-party channel integrations. Keep it labeled as **"Device Pairing"** or **"Mobile App Keys"** under Settings, and introduce a separate **"Integrations" / "Connected Channels"** section for the work below, so the two don't collide in the UI or data model.

**Priority order for channel integrations:**
1. **Telegram first** — free, simplest bot API, no business approval process, fastest way to validate "characters via messaging app" before investing more.
2. **WhatsApp Business API second** — highest value for the Africa-first audience (most target users already live in WhatsApp), but requires Meta Business verification, per-conversation costs, and meaningfully more integration complexity. Validate on Telegram first.
3. **Discord third** — moderate effort, useful for community/Resident-Bot-style use cases.
4. **X (Twitter) — deprioritize.** API access costs have been volatile for third-party bots; low expected ROI for this audience.
5. **USSD — deprioritize significantly**, and treat as a distinct, expensive project (telco/aggregator commercial agreements, ongoing per-session costs, very different interaction model), not a simple integration. Revisit once there's revenue to justify the aggregator relationship.

Build these as a single internal "channel gateway" abstraction (inbound message → normalize → route to character/session logic → normalize response → outbound to correct channel), so each additional channel is incremental rather than a rewrite.

---

### 6.8 Admin

The existing implementation is a stronger foundation than a fresh build would suggest:
- `Character.isVerified` (verified badge) and `isFeatured` (curation) are separate, independent booleans.
- `CharacterReport` has a `category` enum (harmful/spam/nsfw/misinformation/other) and `status` (pending/resolved/dismissed).
- The admin queue surfaces both unverified-public characters and pending reports.
- Rejection sets `visibility: private`, clears `isVerified`, and enforces a **24-hour resubmission cooldown** via a check for a recent `REJECTED:`-tagged resolved report.

**Important nuance:** despite the admin UI being labeled "Pending Reviews," nothing in the character-listing route actually gates *visibility* on `isVerified` — a newly created public character is immediately discoverable in Explore before any admin looks at it. The system already behaves like "post-hoc moderation with an optional trust badge," which is close to the intended end state (no pre-approval gate, report-driven takedown, admin-assigned verified badge). The work here is mostly **relabeling/reframing**, not rebuilding:

1. Rename "Pending Reviews" → something like "Verification Queue" in the admin UI, with copy making clear these characters are already live, not awaiting a gate.
2. Net-new admin features still needed: bulk/targeted notification triggering, a support inbox with reply-to-email, a revenue/payout dashboard (once §6.2.5 ships), a token/cost-monitoring dashboard (Gemini spend vs. revenue — currently no visibility into this at all), user account actions (suspend, force logout, reset 2FA), and an audit log of admin actions.
3. The 24-hour rejection-cooldown mechanism (special-prefixed report notes acting as a lightweight state machine) is a cheap, reusable pattern worth applying to other "cooldown after action" needs rather than adding new status columns each time.

---

### 6.9 Security, Sessions & Other Improvements

#### 6.9.1 Regenerated response versioning

`/api/chats/[id]/regenerate` currently **deletes** every message after the last user message and generates a new one — no version history is retained. Implement version retention (a linked list of message versions, not a full duplicate row per regeneration) with an arrow switcher, matching the ChatGPT-style pattern.

#### 6.9.2 Multiple chats per character

`/chats?character=<slug>` currently redirects into an existing chat with that character if one exists, rather than always starting a new thread — so a user can only ever have one ongoing chat per character today. Add the ability to start additional chat threads within the same character.

#### 6.9.3 Sessions — fix before building on top of it

`auth.ts` uses `session: { strategy: 'jwt' }`, so NextAuth does not persist session rows to the `Session` table for normal web logins. But `/api/settings/sessions` reads from that same table — finding it empty, it currently **seeds two fake mock sessions** ("Chrome on macOS," "Safari on iOS") directly into the database just so the settings UI has something to render. This is writing synthetic rows into a real table, not just a cosmetic placeholder, and needs to be fixed rather than built upon.

**Decision: move to the `database` session strategy** (NextAuth supports this, and `@auth/prisma-adapter` is already wired up), which makes the `Session` table meaningfully populated and real device/session revocation close to free, versus significant custom bookkeeping to fake it under the JWT strategy. Because this touches every authenticated request path (`proxy.ts`'s session lookup, `auth.ts`/`auth.config.ts`), do it as its own isolated migration before layering 2FA or session-management UI on top of it.

#### 6.9.4 TOTP 2FA

No 2FA-related model exists in the schema today (no secret storage, no backup codes) — confirmed fully unbuilt. Add a `TwoFactorSecret` model (encrypted secret, backup-code hashes) with a challenge step in **both** the NextAuth Credentials flow *and* the separate `/api/auth/login` Bearer-token route used by the mobile client — a 2FA implementation that only covers the web cookie flow and misses the mobile JWT flow leaves a real bypass. TOTP (Google Authenticator-style) is the right first implementation — cheaper and simpler than SMS-based 2FA, no added SMS cost/fraud surface.

#### 6.9.5 Other small, confirmed gaps

- **Custom delete-confirmation modal** (type the chat title to confirm) in place of a JS `alert()`.
- **Display name**, unique, separate from real name — `User` currently has only a single `name` field. Decide mutability rules (a handle-history or cooldown period avoids impersonation-by-renaming if names are freely changeable).
- **Split name into first/last/other** — same underlying gap.
- **Country + currency selection** at registration and in profile — `User` has no `country` or `currency` field today; build together with §6.3's regional pricing, not separately.
- **Profile image upload** — `/api/settings/profile` currently only updates `name`, not `image`, even though the Cloudinary upload endpoint used for character avatars (5MB limit, image-type validation) can be reused as-is for profile photos. Cheap win: just point the profile client at the existing `/api/upload` endpoint and persist the returned URL.
- **Phone number + verification** — no field on `User` today; build once alongside SMS notification support (§6.4) so the verification flow serves both profile completeness and SMS opt-in.
- **Support**: a contact form with attachment support, an FAQ section, and a visible ticket status (open/in-progress/resolved) so users aren't left wondering if their message was seen — important for trust at a scale where live chat support isn't feasible.

---

### 6.10 Separation of Concerns / Architecture

Don't split into subdomains/services yet — modularize the monolith instead. As a solo developer, multiple deployables means more to operate and monitor with no team to share the load; the actual concern (bundle size, performance) is usually solvable within a monolith via code-splitting/lazy-loading rarely-used surfaces like the admin panel.

**When splitting later (Phase 6+), suggested order:**
1. **Admin panel** — least real-time coupling to the main chat experience, and splitting it improves security posture (smaller attack surface on the main app).
2. **Notification service** as a background worker — natural to extract once it's queue-based (§6.4).
3. **Channel gateway** (§6.7) — genuinely different traffic pattern (webhook-driven), reasonable to isolate once 2+ channels are live.
4. **`api.airacter.com`** for external developer access — only once actual third parties want programmatic access to Airacter itself, not speculatively.

---

## 7. Non-Functional Requirements

- **Cost control is first-class.** Every character chat costs real money via the Gemini API. Token metering, per-user rate limiting, and the Phase 4 community debounce logic (§6.5) all exist primarily to protect margin, not just UX. There is currently no cost-monitoring dashboard (§6.8) — this is a real blind spot today.
- **Multi-provider AI abstraction.** `lib/ai-gateway.ts` is Gemini-specific today — this is exactly the seam to introduce a provider interface at, so adding OpenAI/Claude later is a new adapter rather than a chat-logic rewrite. This also naturally supports RAG (§6.1.2), which is provider-agnostic by design.
- **Data protection.** Given health-adjacent characters and financial/tax data uploads, review NDPR obligations before those categories go live.
- **Performance.** Lazy-load admin, community, and settings surfaces; keep the core chat experience's initial bundle lean.

---

## 8. Success Metrics (initial set — refine once live)

- Paid conversion rate (free → any paid tier)
- Revenue per active character (for creator payout viability)
- Gemini API cost as % of revenue (the actual margin signal)
- Creator retention (characters still receiving chats 30/60/90 days after creation)
- WhatsApp/Telegram bridge adoption once shipped (Phase 3)

---

## 9. Remaining Open Item

Which character categories (health, legal, financial, mental health) require mandatory admin review even without general pre-approval — deferred to a later pass. Everything else needed to start Phase 0/1 build work is decided above.

---

*End of PRD v1.0.*
