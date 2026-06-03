# Airacter — Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Last Updated:** June 1, 2026  
**Author:** Product Team  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals and Success Metrics](#3-goals-and-success-metrics)
4. [User Personas](#4-user-personas)
5. [System Architecture Overview](#5-system-architecture-overview)
6. [Feature Specifications](#6-feature-specifications)
   - 6.1 Authentication & Onboarding
   - 6.2 Character System
   - 6.3 Chat System
   - 6.4 Token Economy
   - 6.5 Community & Explore
   - 6.6 Settings & Profile
   - 6.7 Admin Panel
7. [Data Models](#7-data-models)
8. [API Specification](#8-api-specification)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Security Requirements](#10-security-requirements)
11. [Tech Stack Recommendation](#11-tech-stack-recommendation)
12. [Milestones & Phasing](#12-milestones--phasing)
13. [Open Questions & Risks](#13-open-questions--risks)

---

## 1. Executive Summary

**Airacter** is a character-driven AI chat platform where every conversation is shaped by a persona — a role, personality, or character that the AI fully adopts for the duration of the interaction. Unlike standard AI chatbots where every conversation feels identical, Airacter gives users the power to define *who* they are talking to: a Socratic tutor, a brutally honest code reviewer, a 1920s detective, a Stoic life coach, or any custom persona they imagine.

Users can select from a growing community library of pre-built characters, create private characters for personal use, or publish their own characters for others to discover. Every character carries its own tone, knowledge focus, and behavioral constraints. The platform runs on a token-based economy — new users receive a free allocation on registration and may purchase additional tokens as needed.

The core differentiator is the **character layer**: the same AI engine produces dramatically different, contextually appropriate conversations depending on the active character. This turns Airacter from a utility into a platform with genuine replayability, community engagement, and creative depth.

---

## 2. Problem Statement

Existing AI chat products suffer from a critical uniformity problem: every conversation sounds like the same assistant. Users who want a coding mentor, a creative writing partner, a debate opponent, or a language tutor must either use separate specialised tools or constantly re-prompt a general assistant to adopt a role — a tedious and often ineffective process.

Additionally, there is no social layer around AI conversations. Users build useful, creative characters and have no way to share them. There is no community, no discovery, and no feedback loop that improves the character library over time.

Airacter solves both problems: it makes character persistence a first-class product feature, and it builds a community layer around character creation and sharing.

---

## 3. Goals and Success Metrics

### Product Goals

| Goal | Description |
|---|---|
| G1 | Make character-driven AI conversations seamless and delightful |
| G2 | Build a self-sustaining community character library |
| G3 | Establish a sustainable token-based monetisation model |
| G4 | Ensure the platform is fast, reliable, and secure |

### Success Metrics (90-day post-launch)

| Metric | Target |
|---|---|
| Registered users | 10,000 |
| DAU / MAU ratio | ≥ 30% |
| Average chats per active user per week | ≥ 5 |
| Community characters published | ≥ 500 |
| Token purchase conversion rate | ≥ 8% of MAU |
| Average response latency (P95) | < 3 seconds |
| Core Web Vitals — LCP | < 2.5s |

---

## 4. User Personas

### Persona 1 — The Creative Explorer
**Name:** Amara, 26, UX designer  
**Goal:** Uses Airacter to brainstorm with characters that push back — a devil's advocate, a harsh critic, a method-actor collaborator for storytelling.  
**Pain point:** Generic AI always agrees and hedges. She wants genuine intellectual friction.  
**Key features:** Character creation, custom tone settings, private characters.

### Persona 2 — The Learner
**Name:** Kofi, 21, university student  
**Goal:** Uses specific educational characters (Socratic tutor, exam quizzer, debate coach) to study more actively.  
**Pain point:** Standard AI gives answers; he wants to be made to think.  
**Key features:** Community library, pre-built educational characters, chat history.

### Persona 3 — The Builder
**Name:** Priya, 34, software engineer  
**Goal:** Creates highly tailored technical characters (senior code reviewer, system design interviewer) and shares them with her team.  
**Pain point:** No existing tool lets her encode team-specific conventions into an AI persona and share it privately.  
**Key features:** Advanced character editor, public/private visibility, team sharing (future).

### Persona 4 — The Casual User
**Name:** Tobi, 29, marketing manager  
**Goal:** Drops in for fun — chatting with entertaining characters, trying trending community creations.  
**Pain point:** AI chatbots feel dry and transactional.  
**Key features:** Explore page, trending characters, low-friction onboarding.

---

## 5. System Architecture Overview

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Next.js)                      │
│  Auth UI · Chat Interface · Character Studio · Explore       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / REST + Server Actions
┌──────────────────────▼──────────────────────────────────────┐
│                   Next.js App Server                         │
│  Route Handlers · Server Actions · Middleware (Auth)         │
└────┬─────────────────┬──────────────────────────────────────┘
     │                 │
┌────▼────┐      ┌─────▼──────────┐      ┌────────────────────┐
│ Prisma  │      │   AI Gateway   │      │  Email Service     │
│   ORM   │      │  (rate limit,  │      │  (Nodemailer /     │
│         │      │  token deduct) │      │   Resend)          │
└────┬────┘      └─────┬──────────┘      └────────────────────┘
     │                 │
┌────▼────┐      ┌─────▼──────────┐
│PostgreSQL│     │  Gemini API /  │
│ (primary│      │  OpenAI API    │
│  store) │      └────────────────┘
└─────────┘
```

### Key Architectural Decisions

- **Next.js App Router** with server components for initial data fetching and server actions for mutations. Reduces client bundle and improves SEO on public pages.
- **Prisma + PostgreSQL** for relational data (users, characters, chats, responses, token ledger). PostgreSQL chosen over MongoDB for ACID compliance needed in the token ledger.
- **AI Gateway layer** — a thin server-side abstraction that handles model selection, injects the character system prompt, counts tokens, updates the ledger, and enforces rate limits before calling the underlying model API. This layer is swappable; the application is not coupled to a single model provider.
- **JWT sessions** via NextAuth with database-backed adapter for session persistence.
- **Token ledger** — an append-only `TokenTransaction` table (debit on usage, credit on purchase) rather than a mutable `tokens` column. This ensures auditability and prevents race conditions.

---

## 6. Feature Specifications

---

### 6.1 Authentication & Onboarding

#### 6.1.1 Registration

**Trigger:** User visits `/auth/register`

**Fields:**
- Full name (2–50 characters)
- Email address (validated format, unique)
- Password (min 8 chars, requires uppercase, lowercase, digit, and special character)
- Confirm password

**Process:**
1. Client-side validation on blur and on submit
2. Server action validates with Zod schema
3. Password hashed with bcrypt (cost factor 12)
4. User record created with `emailVerified: null`
5. Verification token generated (UUID v4, expires in 1 hour)
6. Verification email dispatched via email service
7. User redirected to `/auth/registered?email=<email>` — a holding page explaining they must verify their email
8. Free token allocation of **50,000 tokens** credited to the user's token ledger on email verification (not on registration, to prevent abuse)

**Error states:**
- Email already registered → "An account with this email already exists"
- Passwords do not match → inline field error
- Weak password → specific feedback (e.g. "Missing uppercase letter")
- Server error → generic toast with retry CTA

#### 6.1.2 Email Verification

- User clicks the link in the email → `GET /auth/verify?token=<token>`
- Token looked up in `VerificationToken` table
- Expiry checked; if expired → user shown the resend form
- On success: `emailVerified` set to `now()`, token record deleted, free tokens credited, user redirected to `/auth/login` with a success toast
- Resend flow: 15-second cooldown enforced client-side; new token generated and replaces old record

#### 6.1.3 Login

**Methods:**
- Email + password (credentials)
- Google OAuth
- GitHub OAuth (optional, Phase 2)

**Credential flow:**
1. Email checked against database
2. If user registered via OAuth only → "This account uses Google login"
3. If email not verified → redirect to `/auth/registered?email=<email>`
4. bcrypt comparison; on match → session created, redirect to `/chat`

**OAuth flow:**
- Standard NextAuth OAuth callback
- On first OAuth login: user created with `emailVerified` set to `now()`, free tokens credited immediately
- Profile image and name populated from provider

#### 6.1.4 Forgot Password (Phase 2)

- Email input → password reset token generated (15 min expiry)
- Email with reset link dispatched
- Reset page accepts new password with same strength requirements
- Old sessions invalidated on password change

#### 6.1.5 Session Management

- JWT strategy with 30-day expiry
- Token refreshed on activity
- Multiple concurrent sessions allowed (no single-session enforcement)
- Logout invalidates current session token

---

### 6.2 Character System

The character system is the core differentiator of Airacter. A **Character** is a structured persona definition that is injected as a system prompt into every AI conversation it governs.

#### 6.2.1 Character Data Structure

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String (3–60 chars) | Display name of the character |
| `slug` | String | URL-safe unique identifier |
| `description` | String (max 200 chars) | Short public-facing summary |
| `systemPrompt` | Text (max 2000 chars) | Full persona instruction injected as system prompt |
| `avatarType` | Enum: `emoji`, `initials`, `image` | How the avatar is rendered |
| `avatarValue` | String | Emoji char, initials string, or image URL |
| `avatarColor` | String (hex) | Background color for initials/emoji avatars |
| `tone` | String[] | Tags: `formal`, `casual`, `humorous`, `serious`, `empathetic`, `blunt`, `Socratic` |
| `category` | Enum | `education`, `productivity`, `entertainment`, `wellness`, `creative`, `technical`, `fun`, `other` |
| `visibility` | Enum: `private`, `public` | Who can see and use the character |
| `createdBy` | FK → User | Author |
| `isVerified` | Boolean | Admin-verified (displayed with a badge) |
| `isFeatured` | Boolean | Admin-curated for homepage |
| `usageCount` | Int | Incremented on each new chat |
| `saveCount` | Int | Number of users who saved this character |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

#### 6.2.2 Pre-built Characters (Seed Data)

Airacter ships with a curated set of pre-built characters in the following categories:

**Education**
- Socratic Tutor — never answers directly, only asks questions
- Exam Quizzer — generates practice questions on any topic
- Language Partner — converses in a chosen target language, corrects mistakes inline
- Debate Coach — always takes the opposing view to sharpen arguments

**Productivity**
- Brutal Code Reviewer — merciless, specific, no sugarcoating
- System Design Interviewer — asks architecture questions, probes assumptions
- Product Manager — frames everything as user stories and success metrics
- The Devil's Advocate — challenges every idea presented

**Creative**
- Screenwriter — responds in script format, builds narrative tension
- 1920s Detective — Raymond Chandler noir voice, everything is a mystery
- Fantasy World Builder — collaborative lore generator

**Wellness & Personal Growth**
- Stoic Life Coach — Marcus Aurelius-inspired, focuses on what is in your control
- Gratitude Journal Companion — warm, reflective, prompts daily gratitude
- Career Mentor — direct, experience-focused, no fluff

**Entertainment & Fun**
- Nigerian Street Food Vendor — life advice through food metaphors, Pidgin-inflected
- Overly Enthusiastic Hype Man — finds the best in everything
- Sarcastic Comedian — dry wit, does not suffer foolishness
- Time Traveller from 1850 — genuinely confused by modern references

#### 6.2.3 Character Creation

**Access:** Any authenticated user can create characters.

**Character Studio** (`/characters/new`):

Step 1 — Identity
- Character name
- Short description (shown in cards and search results)
- Avatar builder: choose emoji from a picker OR set color + initials; option to upload image (Phase 2)
- Category selector (single select)
- Tone tags (multi-select, max 4)

Step 2 — Persona
- System prompt textarea (the core instruction)
- Live character count with color-coded limit indicator
- Writing tips panel (collapsible): guidance on how to write effective system prompts — e.g. "Start with 'You are…'", "Define constraints explicitly", "Specify response format if relevant"
- Example prompts auto-inserted on category selection as a starting point (user edits from there)

Step 3 — Visibility & Preview
- Visibility toggle: Private / Public
- Preview panel: a mini embedded chat interface where the user can test the character before saving
- Preview uses the current system prompt in real-time (costs tokens — displayed as "Test cost: ~X tokens")

**Validation:**
- Name: 3–60 chars, unique per user
- System prompt: 20–2000 chars
- At least one tone tag required
- Category required

**After saving:**
- Character appears in "My Characters" panel
- If public: enters a review queue before appearing in the Explore tab (auto-approved unless flagged; admin reviews flagged characters)

#### 6.2.4 Character Editing

- All fields editable from the Character Studio
- Editing a character does not affect existing chats (chats store a snapshot of the system prompt at creation time — see Chat System)
- Changing visibility from Public → Private immediately removes it from Explore and from others' Saved Characters (with a warning modal)

#### 6.2.5 Character Saving

- Users can save public characters to their personal library ("My Characters")
- A save creates a `CharacterSave` join record; it does not copy the character
- Saved characters are always shown at the correct latest visibility — if the original is deleted or made private, the saved copy becomes unavailable (user shown a "Character no longer available" state)
- Save count is denormalized on the `Character` record and incremented/decremented on save/unsave

---

### 6.3 Chat System

#### 6.3.1 Creating a New Chat

1. User clicks "New Chat" in the sidebar
2. Character selection modal opens (see below)
3. User selects a character
4. Chat record created with:
   - `characterId` (reference)
   - `systemPromptSnapshot` (copy of the prompt at this moment — immutable)
   - `title` — initially `null`, generated by AI after the first message
5. User lands on the new chat page with the character header displayed and the input ready

**Character Selection Modal:**
- Tabs: "My Characters" | "Explore Public"
- Search bar (client-side filter, debounced)
- Character cards: avatar, name, category tag, short description
- "Use Character" button
- "Quick Define" option: a single textarea to describe a role inline without creating a named character (creates an anonymous, private, non-saved character for this chat only)

#### 6.3.2 Chat Interface

**Layout:**
- Character header bar (pinned): avatar, character name, role description, "Change Character" button (creates new chat with a different character), kebab menu
- Message thread (scrollable)
- Input area (bottom, sticky)

**Message thread:**
- User messages: right-aligned, primary color bubble, user avatar
- AI messages: left-aligned, character avatar, markdown rendered (code blocks with syntax highlighting, tables, ordered/unordered lists, bold, italic, inline code)
- Timestamps shown on hover
- Each AI message has action buttons (appear on hover): Copy, Read Aloud (TTS), Regenerate (resend same question, new response — costs tokens), Thumbs Up / Thumbs Down (feedback)
- System messages (e.g. "Chat started with Socratic Tutor") as a centered, muted pill

**Input area:**
- Auto-expanding textarea (min 1 row, max ~5 rows)
- Send button (disabled when empty or when out of tokens)
- Token balance indicator (e.g. "12,450 tokens left") — clicking it opens the token purchase modal
- When out of tokens: input disabled, banner "You've run out of tokens. [Buy more →]"
- Keyboard shortcut: `Enter` to send, `Shift+Enter` for new line

**Streaming responses:**
- AI responses stream token-by-token (Server-Sent Events or streaming server action)
- Animated typing indicator (three dots) before first token arrives
- Token count deducted after full response received (not during stream)
- If stream fails mid-response: partial response shown with an error state and a "Retry" button

#### 6.3.3 Chat List & Sidebar

**Sidebar (middle panel when "Chats" is active):**
- "New Chat" button at top
- Chats grouped by date: Today, Yesterday, Last 7 days, Last 30 days, then by month
- Each item: character avatar, chat title, relative timestamp, active state highlight
- Long-press / right-click context menu on each item: Rename, Delete
- Rename: inline edit field, saved on blur or Enter
- Delete: confirmation modal ("This cannot be undone")
- Search bar at top of list: filters chats by title and message content (server-side, debounced 300ms)

**Auto-titling:**
- After the first AI response, a background call generates a title from the first user message
- Title generated by asking the AI: "Summarize this prompt in under 8 words, plain text, no punctuation at the end: {prompt}"
- Title updated optimistically in the sidebar

#### 6.3.4 Search

Two modes:

**Chat list search** — searches chat titles + message content for the authenticated user. Returns a flat list of matching chats and individual messages, grouped by match type (Chat title / Message).

**In-chat search** — searches within the active chat's message history. Highlights matching text, scrolls to match, supports next/previous navigation.

#### 6.3.5 Response Actions

| Action | Description | Token cost |
|---|---|---|
| Copy | Copies raw markdown to clipboard | None |
| Read Aloud | Uses Web Speech API (SpeechSynthesis) to read the response | None |
| Regenerate | Re-submits the same question, returns a new response | Standard message cost |
| Thumbs Up/Down | Submits feedback; stored for model improvement | None |

#### 6.3.6 Chat Export (Phase 2)

- Export chat as Markdown file
- Export chat as PDF
- Share chat as a public read-only link (generates a unique URL, user controls expiry)

---

### 6.4 Token Economy

#### 6.4.1 Token Model

Tokens in Airacter map approximately to model tokens (input + output combined). The exact rate is configurable per model in the admin panel. A rough guide:

- 1 Airacter token ≈ 1 model token
- Average conversational message costs ~500–2,000 tokens
- A new user's 50,000 free tokens ≈ 25–100 conversations depending on response length

#### 6.4.2 Token Ledger

All token movements are recorded in an append-only `TokenTransaction` table:

| Field | Description |
|---|---|
| `id` | UUID |
| `userId` | FK → User |
| `type` | Enum: `credit_welcome`, `credit_purchase`, `debit_message`, `credit_admin`, `debit_refund` |
| `amount` | Positive integer (always positive; type encodes direction) |
| `direction` | Enum: `credit`, `debit` |
| `referenceId` | Optional FK to related Response or Purchase record |
| `metadata` | JSONB — model used, character used, message length, etc. |
| `createdAt` | DateTime |

A materialized view (or computed column) provides the current balance as `SUM(credits) - SUM(debits)`.

**Why append-only?** Prevents balance manipulation, enables full audit trail, supports dispute resolution for purchases.

#### 6.4.3 Token Deduction Flow

1. User submits a message
2. Server action verifies balance > 0 before calling the AI gateway
3. AI gateway calls the model, receives response + usage metadata
4. A `debit_message` transaction is inserted with the actual token count
5. Balance is re-computed and returned to the client
6. If balance drops to 0 or below during a stream, the stream is not interrupted; the debit completes normally. Future requests are blocked until balance is positive again.

#### 6.4.4 Token Packages

| Package | Airacter Tokens | Price (USD) | Notes |
|---|---|---|---|
| Starter | 50,000 | $2.00 | |
| Standard | 200,000 | $6.00 | Best value badge |
| Pro | 500,000 | $12.00 | |
| Power | 1,500,000 | $30.00 | |

Pricing and packages are configurable in the admin panel without a code deploy.

#### 6.4.5 Payment Integration (Phase 2)

- Stripe Checkout for payment processing
- Webhook handler for `checkout.session.completed` event
- On successful payment: `credit_purchase` transaction inserted, balance updated
- Receipts emailed automatically by Stripe
- Refund requests handled via admin panel (issues `credit_refund` transaction)

#### 6.4.6 Low Balance Notifications

- Toast notification when balance drops below 5,000 tokens
- Email notification (opt-in) when balance drops below 1,000 tokens
- In-app banner when balance is 0

---

### 6.5 Community & Explore

#### 6.5.1 Explore Page (`/explore`)

**Purpose:** Discover and save public characters created by the community.

**Layout:**
- Featured characters row (admin-curated, max 6)
- Category filter bar (horizontal scrollable chips): All, Education, Productivity, Entertainment, Wellness, Creative, Technical, Fun
- Sort options: Most Popular, Newest, Trending (based on usage growth in the last 7 days)
- Character card grid (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
- Search bar (queries character name, description, and category)
- Pagination or infinite scroll (infinite scroll preferred for engagement)

**Character Card:**
- Avatar (emoji/color/image)
- Character name
- Category badge
- Short description (truncated at 2 lines)
- Creator username with avatar
- Usage count ("Used in X chats")
- Save button (heart icon; filled if already saved)
- "Chat Now" button

#### 6.5.2 Character Profile Page (`/characters/:slug`)

Full detail page for a public character:
- Full description and system prompt preview (first 200 chars, "Show more" toggle)
- Tone tags
- Creator profile link
- Usage statistics
- Reviews / ratings (Phase 2)
- Related characters (same category, same creator)
- "Chat Now" and "Save" CTAs

#### 6.5.3 Creator Profile Page (Phase 2)

- Public profile showing all public characters created by a user
- Total usage count across all characters
- Follower/following system

#### 6.5.4 Moderation

**Automated:**
- System prompt scanned for disallowed content categories before publishing (using a moderation model or keyword heuristic)
- Characters with flagged content held in review queue, not published until admin approval

**Community:**
- Report button on every public character card
- Reports logged with category: Harmful Content, Misinformation, Spam, NSFW, Other
- Characters with ≥3 reports within 48 hours auto-suspended pending admin review

**Admin:**
- Admin dashboard shows review queue, report queue, and recently published characters
- Admin can: approve, reject (with reason sent to creator), permanently ban a character, and ban a user

---

### 6.6 Settings & Profile

#### 6.6.1 Profile Settings

- Display name (editable inline)
- Email address (read-only; change email is Phase 2)
- Profile image: upload from device (Phase 2) or keep OAuth provider image
- Bio (max 160 chars) — shown on public creator profile (Phase 2)

#### 6.6.2 Token Management

- Current balance (large, prominent)
- Visual progress bar relative to the highest purchased package
- Transaction history: paginated table of all transactions (date, type, amount, reference)
- "Buy Tokens" CTA → opens purchase modal

#### 6.6.3 Notification Preferences

- Email notifications: low balance warning, email verification, character approved/rejected, (Phase 2: new follower, character liked)
- In-app notifications (Phase 2)

#### 6.6.4 Appearance

- Theme: System default / Light / Dark

#### 6.6.5 Security

- Connected accounts (OAuth providers linked to this account)
- Change password (credentials users only)
- Active sessions list with "Log out other devices" (Phase 2)

#### 6.6.6 Danger Zone

- Delete account — confirmation by typing email address, all data deleted (except anonymized transaction records for financial compliance)
- Data export request (GDPR compliance) — triggers email with JSON export within 24 hours (Phase 2)

---

### 6.7 Admin Panel

The admin panel is a separate protected route (`/admin`, role: `ADMIN`) and is not part of the public application design. Minimum viable features:

| Feature | Description |
|---|---|
| User management | View users, manually credit tokens, ban/unban accounts |
| Character review queue | Approve or reject flagged/new public characters |
| Report queue | Review reported characters and act accordingly |
| Token package management | Edit pricing and token amounts without code deploy |
| Featured characters | Add/remove characters from the Explore featured row |
| Pre-built character management | Edit seed characters |
| Revenue overview | Total purchases, total tokens issued, total tokens consumed (Phase 2: Stripe dashboard integration) |

---

## 7. Data Models

### User
```
User {
  id              String   @id
  name            String
  email           String   @unique
  emailVerified   DateTime?
  image           String?
  password        String?
  role            Enum(USER, ADMIN)
  createdAt       DateTime
  updatedAt       DateTime

  accounts        Account[]
  characters      Character[]
  characterSaves  CharacterSave[]
  chats           Chat[]
  transactions    TokenTransaction[]
}
```

### Character
```
Character {
  id               String
  slug             String   @unique
  name             String
  description      String
  systemPrompt     String
  avatarType       Enum(emoji, initials, image)
  avatarValue      String
  avatarColor      String
  tone             String[]
  category         Enum(education, productivity, ...)
  visibility       Enum(private, public)
  isVerified       Boolean
  isFeatured       Boolean
  usageCount       Int
  saveCount        Int
  createdBy        FK → User
  createdAt        DateTime
  updatedAt        DateTime

  chats            Chat[]
  saves            CharacterSave[]
  reports          CharacterReport[]
}
```

### CharacterSave
```
CharacterSave {
  id           String
  userId       FK → User
  characterId  FK → Character
  savedAt      DateTime

  @@unique([userId, characterId])
}
```

### Chat
```
Chat {
  id                   String
  title                String?
  userId               FK → User
  characterId          FK → Character
  systemPromptSnapshot String     // immutable copy at chat creation
  createdAt            DateTime
  updatedAt            DateTime

  messages             Message[]
}
```

### Message
```
Message {
  id        String
  chatId    FK → Chat
  role      Enum(user, assistant)
  content   String
  feedback  Enum(up, down)?
  createdAt DateTime

  transaction  TokenTransaction?
}
```

### TokenTransaction
```
TokenTransaction {
  id          String
  userId      FK → User
  type        Enum(credit_welcome, credit_purchase, debit_message, credit_admin)
  direction   Enum(credit, debit)
  amount      Int
  referenceId String?    // FK to Message.id or Purchase.id
  metadata    Json
  createdAt   DateTime
}
```

### Purchase (Phase 2)
```
Purchase {
  id              String
  userId          FK → User
  packageId       String
  tokenAmount     Int
  amountPaidCents Int
  currency        String
  stripeSessionId String
  status          Enum(pending, completed, refunded)
  createdAt       DateTime
}
```

### CharacterReport
```
CharacterReport {
  id          String
  characterId FK → Character
  reportedBy  FK → User
  category    Enum(harmful, spam, nsfw, misinformation, other)
  notes       String?
  status      Enum(pending, resolved, dismissed)
  createdAt   DateTime
}
```

---

## 8. API Specification

All mutations are Next.js Server Actions. Read operations on public data use route handlers where caching is needed.

### Auth
- `POST /api/auth/[...nextauth]` — NextAuth handler (GET, POST)
- `POST /api/email/verification` — Send verification email

### Characters (Server Actions)
- `createCharacter(data)` → Character
- `updateCharacter(id, data)` → Character
- `deleteCharacter(id)` → void
- `saveCharacter(characterId)` → CharacterSave
- `unsaveCharacter(characterId)` → void
- `getMyCharacters()` → Character[]
- `getSavedCharacters()` → Character[]

### Characters (Route Handlers — public, cached)
- `GET /api/characters?category=&sort=&q=&page=` → paginated Character[]
- `GET /api/characters/:slug` → Character (with creator info)

### Chats (Server Actions)
- `createChat(characterId)` → Chat
- `deleteChat(chatId)` → void
- `renameChat(chatId, title)` → Chat
- `searchChats(query, scope)` → SearchResult[]
- `sendMessage(chatId, content)` → streaming response + TokenTransaction

### Tokens (Server Actions)
- `getTokenBalance()` → number
- `getTransactionHistory(page)` → TokenTransaction[]
- `initiateTokenPurchase(packageId)` → Stripe session URL (Phase 2)

### Admin (Server Actions — role: ADMIN)
- `getPendingCharacters()` → Character[]
- `approveCharacter(id)` → void
- `rejectCharacter(id, reason)` → void
- `getReportQueue()` → CharacterReport[]
- `resolveReport(id, action)` → void
- `creditUserTokens(userId, amount, reason)` → TokenTransaction

---

## 9. Non-Functional Requirements

### Performance
- Initial page load (LCP) < 2.5 seconds on 4G connection
- Time to first AI token in streaming response < 1.5 seconds (P50)
- AI full response time (P95) < 8 seconds
- Character search results returned < 500ms
- Chat list renders in < 300ms from navigation

### Availability
- Target uptime: 99.5% monthly (Phase 1)
- AI gateway failover: if primary model provider fails, auto-retry once, then return a graceful error (no token deduction on failure)
- Database connection pooling configured for peak load

### Scalability
- Application is stateless; horizontal scaling via containerization (Docker + cloud run)
- Database read replicas for Explore page queries (Phase 2)
- Response streaming uses Server-Sent Events; connection limits handled by edge runtime (Phase 2)

### Accessibility
- WCAG 2.1 AA compliance
- Full keyboard navigation for chat input, sidebar, character selection modal
- ARIA labels on all icon-only buttons
- Sufficient color contrast in both light and dark themes
- Reduced motion mode respected (no auto-playing animations for users who prefer this)

---

## 10. Security Requirements

### Authentication Security
- Passwords hashed with bcrypt, cost factor 12
- JWT secrets rotated every 90 days
- Brute force protection: account locked for 15 minutes after 5 failed login attempts (IP + account level)
- CSRF protection on all server actions (built into Next.js)

### Data Security
- All database connections over TLS
- PII (name, email) never logged in application logs
- System prompts stored at rest with application-level encryption (Phase 2)
- Stripe payment data never stored server-side (Stripe handles PCI compliance)

### Content Security
- System prompts sanitised before injection (removes prompt injection attempts: instructions to "ignore previous instructions", role-breaking phrases)
- Output from AI scanned for policy violations before storage (configurable moderation model)
- Rate limiting on all server actions: 60 requests/minute per authenticated user, 10 requests/minute per IP for unauthenticated routes

### Infrastructure
- Environment variables managed via secrets manager (not `.env` files in production)
- Dependency audit in CI pipeline (npm audit on every PR)
- Content Security Policy headers configured on all responses

---

## 11. Tech Stack Recommendation

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js - Latest (App Router) | Server components, streaming, REST API routes, server actions — all needed here |
| Language | TypeScript (strict mode) | Type safety across full stack |
| Database | PostgreSQL (Docker Postgres Image for development; via Prisma Postgres, Neon or Supabase for production) | ACID compliance for token ledger; better for relational queries than MongoDB |
| ORM | Prisma | Already familiar; excellent TypeScript types |
| Auth | NextAuth v5 (Auth.js) | Already in use; supports credentials + OAuth |
| AI Provider | Google Gemini (primary) + OpenAI fallback (future) | Gemini for cost efficiency; OpenAI as fallback (future) |
| Styling | Tailwind CSS v4 | Already in use |
| UI Components | shadcn/ui | Accessible, unstyled base; customisable to Airacter design |
| State Management | Zustand (replace Redux) | Simpler API; less boilerplate for this app's needs |
| Email | Brevo (May switch to Resend later) | Better deliverability and DX than raw Nodemailer |
| Payments | Stripe | Industry standard; excellent webhooks and dashboard |
| Deployment | Vercel | Tight Next.js integration; edge functions for streaming |
| Monitoring | Sentry (errors) + Vercel Analytics (performance) | |
| Testing | Vitest + React Testing Library + Playwright (E2E) | |

---

## 12. Milestones & Phasing

### Phase 1 — Core (Target: 8 weeks)

| Week | Deliverable |
|---|---|
| 1–2 | Project setup, auth (credentials + Google OAuth), email verification, DB schema |
| 3–4 | Character CRUD, Character Studio (create/edit/preview), My Characters panel |
| 5–6 | Chat system: new chat, message streaming, chat list, rename/delete, auto-titling |
| 7 | Token ledger, deduction flow, balance display, low balance states |
| 8 | Explore page (public characters), save/unsave, basic search, admin review queue |

**Phase 1 exit criteria:** A user can register, verify email, create a character, start a chat, send messages, and see their token balance depleted in real time.

### Phase 2 — Growth (Target: weeks 9–16)

- Stripe payment integration
- Character profile pages + creator profiles
- In-chat search with highlight navigation
- Chat export (Markdown, PDF)
- Forgot password / password reset
- Advanced character creation: image avatar upload, character versioning
- Notification system (in-app + email)
- Community features: character ratings, comments

### Phase 3 — Scale (Target: weeks 17–24)

- Team/workspace feature (share characters privately with a team)
- Public chat sharing (read-only links)
- API access for developers (rate-limited)
- Character marketplace (revenue share for popular character creators)
- Mobile apps (React Native or PWA)
- Multiple AI model selection per character (GPT-4, Claude, Gemini — user choice). **NOTE**: Due to cost, only Gemini will be available for now. Other models will be integrated later

---

## 13. Open Questions & Risks

### Open Questions

| # | Question | Owner | Target Date |
|---|---|---|---|
| Q1 | Should the system prompt be fully visible to users viewing a public character, or partially hidden to protect creator IP? | Product | Sprint 1 |
| Q2 | What is the exact token-to-cost mapping per model? This affects pricing. | Engineering | Sprint 1 |
| Q3 | Should "Quick Define" (anonymous characters) count toward usage metrics? | Product | Sprint 2 |
| Q4 | How do we handle currency localisation for token packages (NGN, GBP, EUR)? | Engineering | Sprint 4 |
| Q5 | Is there a content category we want to explicitly block from character creation (e.g. relationship personas, adult content)? | Legal/Product | Sprint 1 |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI API costs exceed projections | Medium | High | Token pricing built with 3× margin; monitor cost per token closely; add model selection flexibility |
| Community publishes harmful characters | High | High | Automated moderation before publishing + report system + manual review queue |
| Prompt injection attacks via system prompts | Medium | Medium | Sanitise system prompts on save; add injection detection layer in AI gateway |
| Token balance race conditions | Low | High | Append-only ledger; check balance server-side before every request |
| Low organic growth on Explore page | Medium | Medium | Seed with high-quality pre-built characters; invest in creator incentives early |
| User confusion about token consumption | Medium | Low | Real-time balance indicator in chat UI; transaction history always accessible |

---

*End of Document*

---

**Document history:**
| Version | Date | Change |
|---|---|---|
| 1.0 | June 2026 | Initial draft |
