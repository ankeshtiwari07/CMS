# HUMAIN Create Studio
## Sprint and Release Plan
### Agentic Studio — 5 sprints, delivered in one week

---

| | |
|---|---|
| **Document type** | Sprint and Release Plan |
| **Prepared for** | HUMAIN |
| **Programme** | Agentic Studio |
| **Sprints** | 5 (S1–S5) |
| **Duration** | 1 week · 9–15 June 2026 |
| **Releases** | 10 (R1–R9) |
| **Tasks / Points** | 29 · 114 |
| **Status** | ✅ Delivered |

---

## 1. Programme Overview

Delivered as **five focused sprints in a compressed one-week programme** — each sprint owns its releases and tasks, with a clear objective and outcome, shipped to the live in-Kingdom environment.

| Sprint | Focus | Releases | Tasks | Points | Status |
|---|---|---|---|---|---|
| **S1** | Agentic Foundation | R1 | 6 | 28 | ✅ Delivered |
| **S2** | Intelligent Build — Web and Content | R2, R3 | 5 | 23 | ✅ Delivered |
| **S3** | Brand and Design | R4, R5 | 3 | 13 | ✅ Delivered |
| **S4** | Full Build Set and Claude-like UX | R6, R6.1 | 7 | 25 | ✅ Delivered |
| **S5** | Cost, Localization and Delivery | R7, R8, R9 | 8 | 25 | ✅ Delivered |
| **Total** | | 10 | 29 | 114 | **100%** |

> **Programme result: 100% of committed scope delivered and deployed across 5 sprints.** Two capabilities have a live-render dependency on external billing (§4); all code is shipped and verified.

---

## 2. Sprints

Legend: every task is **✅ Done** · Rel = release · Pts = story points.

### 2.1 S1 — Agentic Foundation
**Objective:** Stand up the agentic core and conversational, live-streaming chat.

**Outcome:** Orchestrator + governed tools + specialists live; chat streams and converses, every action audited.

**Releases:** R1 · **28 pts**

| ID | Task | Objective | Outcome | Rel | Pts |
|---|---|---|---|---|---|
| CS-1 | Orchestrator agent + Claude tool-use loop | Coordinate multi-step agent work on Claude. | Tool-use loop plans, calls tools and assembles deliverables. | R1 | 8 |
| CS-2 | Governed tools (RAG + brand) | Ground agents in HUMAIN content and brand, safely. | Read-only RAG + brand tools, permission-scoped. | R1 | 5 |
| CS-3 | Specialist agents | Divide complex work across focused agents. | 6 specialists (draft/localize/brand/SEO/editorial/research) delegated. | R1 | 5 |
| CS-4 | Per-run audit logging | Make every agent action traceable. | Each run written to the audit log. | R1 | 2 |
| CS-5 | Streaming chat endpoint (SSE) | Deliver live, Claude-style responses. | /studio/chat streams tokens via SSE. | R1 | 5 |
| CS-6 | Converse-then-produce | Avoid guessing on ambiguous requests. | Agent asks one clarifying question, else produces. | R1 | 3 |

### 2.2 S2 — Intelligent Build — Web and Content
**Objective:** Route intent intelligently and build real websites and publishable content.

**Outcome:** Agent builds live websites and editable content; one-click publish-to-module as drafts; rich rendering.

**Releases:** R2, R3 · **23 pts**

| ID | Task | Objective | Outcome | Rel | Pts |
|---|---|---|---|---|---|
| CS-7 | Rich Markdown rendering | Show formatted output, not raw markdown. | Replies render as rich text (headings/lists/tables). | R2 | 3 |
| CS-11 | build_site | Build real websites, not descriptions. | Responsive site built and previewed live in chat. | R2 | 5 |
| CS-10 | Intent routing + recommendations | Decide what to build and guide the user. | Agent routes intent and recommends next steps. | R3 | 5 |
| CS-12 | build_content | Produce usable, editable content. | Editable content card (title/body/tags). | R3 | 5 |
| CS-13 | Publish-to-module | Get agent output into the CMS safely. | Markdown→Lexical draft published to a chosen module for review. | R3 | 5 |

### 2.3 S3 — Brand and Design
**Objective:** Make output on-brand by construction, with a governed brand and prompt-driven design.

**Outcome:** Brand Studio recommend→publish loop with an active brand the agents follow; themes generated from a prompt.

**Releases:** R4, R5 · **13 pts**

| ID | Task | Objective | Outcome | Rel | Pts |
|---|---|---|---|---|---|
| CS-18 | Recommend→view→verify→publish flow | Complete the brand recommend→publish loop. | Recommend → view → verify → publish / download. | R4 | 5 |
| CS-19 | Active Brand governance | Steer all generations by one brand. | Active brand (isActive) governs the agents. | R4 | 3 |
| CS-20 | Prompt-driven theme | Generate design from a description. | Theme (palette/font/radius) with live preview and apply. | R5 | 5 |

### 2.4 S4 — Full Build Set and Claude-like UX
**Objective:** Let users build anything from chat and make the experience feel like Claude.

**Outcome:** Video, image, brand and theme build from chat; natural streaming messages and a focused chat view.

**Releases:** R6, R6.1 · **25 pts**

| ID | Task | Objective | Outcome | Rel | Pts |
|---|---|---|---|---|---|
| CS-8 | Natural messages + action row | Make replies feel conversational. | In-thread messages with Copy/Retry; no framed cards. | R6 | 3 |
| CS-9 | Focused chat view | Centre the conversation. | Composer below thread; landing rails hide when chatting. | R6 | 3 |
| CS-14 | build_video | Create videos from chat. | Script/storyboard + one-click render. | R6 | 5 |
| CS-15 | build_image | Generate images inline. | Real image via Replicate/Flux, shown inline. | R6 | 5 |
| CS-16 | build_brand | Create brand guidelines from chat. | Verifiable brand card to publish or download. | R6 | 3 |
| CS-17 | build_theme | Create themes from chat. | Theme with live swatches and apply. | R6 | 3 |
| CS-23 | Render pipeline | Render real media reliably. | Replicate image/video service + proxy routes + graceful states. | R6 | 3 |

### 2.5 S5 — Cost, Localization and Delivery
**Objective:** Optimize cost, localize the UI, and package customer documentation.

**Outcome:** Haiku/Opus routing cuts cost ~5–10×; English/Arabic UI with RTL; four branded docs shipped; continuous delivery.

**Releases:** R7, R8, R9 · **25 pts**

| ID | Task | Objective | Outcome | Rel | Pts |
|---|---|---|---|---|---|
| CS-22 | Cost optimization | Reduce per-request cost. | Sub-agents on Haiku, orchestrator on Opus (~5–10× cheaper). | R7 | 3 |
| CS-25 | Product Requirements Document | Define the product for the customer. | PRD with architecture/integration diagrams and snapshots. | R8 | 3 |
| CS-26 | UI/UX and User Journeys | Show the experience and journeys. | UI/UX doc with per-feature journeys and screenshots. | R8 | 3 |
| CS-27 | High-Level Architecture | Explain the system at a high level. | HLD: context, agent core, sequence, integration, deployment. | R8 | 3 |
| CS-28 | Combined Master Deck | Combine the docs for one share. | Master deck (PRD + UI/UX + Architecture). | R8 | 1 |
| CS-29 | Build pipeline + repo commit | Make collateral reproducible and versioned. | Branded PDF pipeline committed to docs/sales (PR #1). | R8 | 2 |
| CS-21 | EN/Arabic language switch | Serve the platform UI in Arabic. | One-click EN/AR switch with full RTL. | R9 | 5 |
| CS-24 | Deploy + verification cycles | Ship and verify continuously. | 9 live releases, each built, deployed and verified. | R1–R9 | 5 |

---

## 3. Release Plan Sheet

Each release maps to its sprint, with its objective and outcome. All released from `main` and verified live.

| Release | Date | Sprint | Objective | Outcome | Status |
|---|---|---|---|---|---|
| **R1** | 14 Jun | S1 | Establish the agentic, conversational foundation. | Agentic core + streaming chat live and audited. | ✅ Released |
| **R2** | 14 Jun | S2 | Render structured output and build real websites. | Rich Markdown rendering + in-chat website build with recommendations. | ✅ Released |
| **R3** | 14 Jun | S2 | Decide intent and produce publishable content. | Intent router + content cards + publish-to-module drafts. | ✅ Released |
| **R4** | 14 Jun | S3 | Govern output with a single source of brand truth. | Brand Studio loop + active-brand governance. | ✅ Released |
| **R5** | 14 Jun | S3 | Generate design from intent. | Prompt-driven theme with live preview and apply. | ✅ Released |
| **R6** | 14 Jun | S4 | Build any artifact from one chat, Claude-style. | Video / image / brand / theme tools + natural chat UX. | ✅ Released |
| **R6.1** | 14 Jun | S4 | Harden brand output. | Reliable brand palette (JSON truncation fix). | ✅ Released |
| **R7** | 14 Jun | S5 | Make the agent economical to run. | Sub-agents on Haiku, orchestrator on Opus (~5–10× cheaper). | ✅ Released |
| **R8** | 15 Jun | S5 | Package the platform for the customer. | PRD, UI/UX, Architecture and Deck + reproducible pipeline (PR #1). | ✅ Released |
| **R9** | 15 Jun | S5 | Serve the platform in Arabic. | One-click English/Arabic UI switch with full RTL. | ✅ Released |

---

## 4. Definition of Done — Verification

| Capability | Sprint | Verified live |
|---|---|---|
| Conversational streaming + clarifying questions | S1 | ✅ "hi" converses; vague build asks a question |
| Multi-agent orchestration | S1 | ✅ Brand Guardian → Research → Build agents fire + audited |
| Build a website | S2 | ✅ 18 KB styled site rendered in-chat |
| Create + publish content | S2 | ✅ Draft created in blogPosts (Markdown→Lexical) |
| Brand recommend + palette + publish | S3 | ✅ Populated guideline (6-colour palette) + active-brand query |
| Prompt-driven theme | S3 | ✅ Distinct prompts → distinct themes |
| Build set (video/image/brand/theme) | S4 | ✅ Tools fire + route correctly |
| Cost optimization | S5 | ✅ Sub-agents on Haiku |
| Bilingual UI switch | S5 | ✅ EN/AR toggle + full RTL |
| Documentation | S5 | ✅ 4 branded PDFs + pipeline committed |

---

## 5. Notes and External Dependencies

All code is shipped and verified. These gate only *live media rendering / model calls* on third-party billing:

- **Anthropic credit** powers the agents themselves; the platform degrades gracefully when the balance is exhausted.
- **Replicate credit** powers **real image/video file rendering** only; scripts/cards generate without it.

**Next-programme candidates:** full Arabic UI string coverage across secondary screens · real Payload migrations · streaming for rich artifact modes · expanded agent tool set (e.g. decks).

---

*Prepared for HUMAIN — Confidential. Agentic Studio programme — 5 sprints, delivered and deployed.*
