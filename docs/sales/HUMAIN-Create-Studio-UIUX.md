# HUMAIN Create Studio
## UI/UX and User Journeys
### Agentic, Bilingual Content and Experience Platform

---

| | |
|---|---|
| **Document type** | UI/UX and User Journey Guide |
| **Prepared for** | HUMAIN |
| **Region** | Kingdom of Saudi Arabia (KSA) — in-region |
| **Classification** | Confidential — Client Presentation |
| **Version** | 1.0 |
| **Date** | June 2026 |

---

## 1. Design Principles

The experience is built on six principles, each visible in the product:

- **Agent-first, not form-first.** A person describes intent in natural language; the agent decides what to build and produces an interactive result. Forms are the fallback, never the starting point.
- **Conversational, like Claude.** Replies stream in as natural messages with light actions (Copy, Retry) — not boxed reports. The assistant asks a clarifying question when needed and recommends next steps.
- **Always an interactive outcome.** Every capability returns something the user can *use* — a live website preview, an editable/publishable card, a theme to apply — never a dead-end text dump.
- **Bilingual by design.** English and Arabic are first-class, including right-to-left layout; the type system carries both (Inter + IBM Plex Sans Arabic).
- **On-brand by construction.** Every surface inherits the central brand tokens; the agent grounds output in the active brand.
- **Governance you can see.** Roles, review gates, publish-as-draft and a complete audit trail are part of the flow — agents propose, humans decide.

---

## 2. Visual Design System

A single token system (colour, typography, spacing, radius) drives every surface, in light and dark, EN and AR. It is itself **prompt-driven** — a user can describe a look and the agent generates a complete, accessible theme with a live preview.

![Design System — tokens + AI theme generation](/Users/ankeshtiwari/Downloads/.prd-build/shots/05-design.png)

- **Palette:** primary teal, primary-dark, lime accent, ink, canvas, muted — each with usage.
- **Typography:** Inter (Latin) + IBM Plex Sans Arabic (Arabic), shared scale.
- **Shape and surface:** configurable corner radius; light/dark surfaces; generous whitespace.

---

## 3. Navigation and Information Architecture

A persistent left sidebar gives one-click access to every capability; the workspace fills the rest.

- **Create new** — start a fresh conversation.
- **Search** — find across content (semantic, Arabic-aware).
- **Projects** — everything produced, as reusable assets.
- **Templates** — structured content modules.
- **Brand** — Brand Studio (recommend → publish brand guidelines).
- **Design** — Design System (prompt-driven theme).

The Studio home is a **single prompt box**: the user types intent and the agent routes to the right outcome — no need to pick a tool first.

![Create Studio home — one prompt box for everything](/Users/ankeshtiwari/Downloads/.prd-build/shots/02-studio.png)

---

## 4. Core Interaction Patterns

- **Conversation thread** — user messages (right) and natural assistant replies (left), streamed live.
- **Artifact cards** — when the agent builds something, it appears inline as an interactive card: a website preview, a content card, a brand card, a theme.
- **Action row** — under each reply: Copy, Retry, and the model used.
- **Manual override** — every generated artifact can be edited by hand (the human is never locked out).
- **Publish / Download** — outcomes can be published (to a CMS module or as the active brand, as a draft for review) or downloaded.

---

## 5. User Journeys

Each journey below is shown as it appears in the product, with the step-by-step UI/UX.

### 5.1 Sign in

![Sign-in](/Users/ankeshtiwari/Downloads/.prd-build/shots/01-login.png)

**Journey:** 1) The user opens the branded sign-in over HTTPS. 2) Enters email + password (OIDC-ready for SSO). 3) On success a secure, role-scoped session starts and they land in Create Studio — seeing only what their role permits.

### 5.2 Converse with the assistant

![Conversational reply](/Users/ankeshtiwari/Downloads/.prd-build/shots/03-chat.png)

**Journey:** 1) The user types a question or a greeting. 2) The assistant **replies conversationally** (it does not over-build) — here it explains what it can create, in a richly formatted, scannable message. 3) It recommends concrete next steps and invites a follow-up. 4) The user can Copy or Retry the reply. *UX note: simple input → conversation, not a form dump.*

### 5.3 Build a website

![Website built live in chat](/Users/ankeshtiwari/Downloads/.prd-build/shots/04-website.png)

**Journey:** 1) The user asks for a site ("build a launch page for our summit"). 2) If details are missing the agent asks one quick question; otherwise it **builds it**. 3) The finished site renders **live in the conversation** with **Open** and **Download**. 4) The agent introduces it and suggests edits ("translate to Arabic", "add a pricing section"). 5) A follow-up refines the same site in place.

### 5.4 Create and publish content

![Content card — edit and publish](/Users/ankeshtiwari/Downloads/.prd-build/shots/07-content.png)

**Journey:** 1) The user asks for content (blog post, article, press release, FAQ, email…). 2) The agent returns an **editable content card** — title, body (rich), summary, auto-tags. 3) The user can **Edit** (manual override), **Copy** or **Download**. 4) They choose a destination module from the **Publish to** dropdown and publish — it lands as a **draft for review** (agents propose, humans approve).

### 5.5 Generate a video

![Video package + render control](/Users/ankeshtiwari/Downloads/.prd-build/shots/08-video.png)

**Journey:** 1) The user asks for a video/teaser. 2) The agent produces a **production-ready package** — logline, concept, scene-by-scene script, shot list, storyboard. 3) A one-click **Render** control turns the script into a real video. 4) The user can refine tone, length or scenes in a follow-up.

### 5.6 Recommend and activate a brand

![Brand Studio — recommend](/Users/ankeshtiwari/Downloads/.prd-build/shots/06-brand.png)

**Journey:** 1) The user describes the brand (industry, audience, tone) — or opens an archetype from the Library. 2) The AI **recommends a full guideline** (essence, voice, palette, typography, messaging). 3) The user **reviews and verifies**, editing any section. 4) They **Publish** it — as the **active brand the agents follow**, or to the library — or **Download** it.

### 5.7 Generate a design theme

![Design System — prompt-driven theme](/Users/ankeshtiwari/Downloads/.prd-build/shots/05-design.png)

**Journey:** 1) In **Describe your design**, the user types a vibe ("bold fintech — deep navy, electric lime, dark mode"). 2) The agent generates a **complete theme** (palette, font, radius, light/dark). 3) The **live preview** updates instantly; the user fine-tunes any token by hand. 4) **Apply** saves it to site settings.

### 5.8 Manage projects

![Projects](/Users/ankeshtiwari/Downloads/.prd-build/shots/09-projects.png)

**Journey:** 1) Everything the user creates is saved as a **Project** asset. 2) They browse, search and reopen prior work. 3) Each project is typed (website, content, brand, video…) and ready to promote into the CMS.

### 5.9 Switch the platform language (English / Arabic)

![Studio in Arabic, right-to-left](/Users/ankeshtiwari/Downloads/.prd-build/shots/10-arabic.png)

**Journey:** 1) From the sidebar user menu the user picks **English** or **العربية**. 2) The entire platform UI switches instantly — selecting Arabic flips everything to **right-to-left** with the Arabic type system. 3) Navigation, greeting, prompt, quick actions and menus are localised. 4) The choice persists across sessions.

---

## 6. Accessibility and Localization

- **EN + AR with correct RTL** across authoring and delivery.
- **Bilingual typography** baked into the token system.
- **Keyboard + voice input** on the prompt box; readable contrast in light and dark.
- **Descriptive alt-text** generated for media by default.

---

## 7. Roles and Responsibilities

The platform is **role-governed**: **7 roles realise 9 personas**, with the same role specialised by **ABAC scope** (site, department, content locale). Each persona sees only what its role and scope permit.

| Persona | Role | Scope (ABAC) | What they see and can do |
|---|---|---|---|
| **Platform Administrator** | `admin` | Global | Configure the platform, users, roles and settings, with full visibility |
| **Site Administrator** | `siteAdmin` | Site-scoped | Own a site/brand surface end-to-end — create, review and publish **within that site**; cannot manage users or global settings |
| **Author (EN)** | `author` | Locale = EN | Create and edit English drafts in scope, with full agent assistance |
| **Author (AR)** | `author` | Locale = AR | Create and edit Arabic drafts in scope, with full agent assistance |
| **Reviewer** | `reviewer` | Site-scoped | Advance content through the editorial gate |
| **Publisher** | `publisher` | Site-scoped | Approve and publish to live channels |
| **Brand Manager** | `brand` | Brand assets | Own the brand guidelines and the active brand |
| **Department Author (e.g. HR)** | `author` | Department-scoped | Produce department content within guardrails (e.g. HR owns Careers) |
| **Viewer** | `viewer` | Read-only | Read-only access to published content and dashboards |

The 7 roles are `admin`, `siteAdmin`, `author`, `reviewer`, `publisher`, `brand`, `viewer`. Every action a persona takes is permission-scoped (RBAC + ABAC, enforced at collection **and** field level) and written to the audit log. Publishing is permission-gated — an author who lacks rights is told to save as draft or request review — and roles/scope can only be changed by a platform admin, so no one can escalate their own privileges.

### 7.1 User and access management

![Users management — roles, scope and creation date](/Users/ankeshtiwari/Downloads/.prd-build/shots/users-created.png)

**Settings → Users** lists every account with its **role(s)**, **department**, **ABAC scope** (sites / locales), **status** (active or disabled) and the **date the account was created**. Admins create, edit, deactivate or delete users here; role and scope assignment is admin-only. **Settings → Access & Roles** shows the live RBAC capability matrix alongside the ABAC rules (site, department, locale, field-level).

---

*Prepared for HUMAIN — Confidential. Snapshots are from the working HUMAIN Create Studio platform.*
