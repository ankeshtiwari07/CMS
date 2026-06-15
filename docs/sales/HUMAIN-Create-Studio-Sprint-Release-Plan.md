# HUMAIN Create Studio
## Sprint and Release Plan
### Sprint 1 — Agentic Studio (1-week delivery)

---

| | |
|---|---|
| **Document type** | Sprint and Release Plan |
| **Prepared for** | HUMAIN |
| **Sprint** | Sprint 1 — "Agentic Studio" |
| **Duration** | 1 week · 9–15 June 2026 |
| **Environment** | In-Kingdom VM · https://cms.34-14-150-134.sslip.io |
| **Status** | ✅ Delivered |

---

## 1. Sprint Overview

| Field | Detail |
|---|---|
| **Sprint goal** | Turn the CMS into a genuinely **agentic, conversational, bilingual** platform — build-anything from one chat, governed and on-brand — and ship customer documentation. |
| **Theme** | Agentic Studio |
| **Sprint length** | 1 week |
| **Outcome** | All committed work delivered and deployed live; product verified end-to-end |
| **Releases shipped** | 9 (R1–R9) |
| **Tasks completed** | 29 / 29 |
| **Story points** | 121 / 121 |

> **Sprint result: 100% of committed scope delivered and deployed.** Two capabilities have a live‑render dependency on external billing (noted in §6); all code is shipped and verified.

---

## 2. Sprint Backlog — Task Sheet

Legend: **✅ Done** · Area: BE = backend (AI service / CMS), FE = frontend (Studio), INF = infra/deploy, DOC = documentation.

### Epic 1 — Agentic Core

| ID | Task | Area | Pts | Status |
|---|---|---|---|---|
| CS-1 | Orchestrator agent + Claude tool-use loop | BE | 8 | ✅ Done |
| CS-2 | Governed tools: RAG `retrieve_context` + `get_brand_guidelines` | BE | 5 | ✅ Done |
| CS-3 | Specialist agents (drafting, localization, brand-guardian, SEO, editorial, research) | BE | 5 | ✅ Done |
| CS-4 | Per-run audit logging (`agent-orchestrator`) | BE | 2 | ✅ Done |

### Epic 2 — Conversational Chat and UX

| ID | Task | Area | Pts | Status |
|---|---|---|---|---|
| CS-5 | Streaming chat endpoint (`/studio/chat`, SSE) | BE | 5 | ✅ Done |
| CS-6 | Converse-then-produce + clarifying questions | BE | 3 | ✅ Done |
| CS-7 | Rich Markdown rendering (remove raw-markdown bug) | FE | 3 | ✅ Done |
| CS-8 | Claude-like natural messages + Copy/Retry action row | FE | 3 | ✅ Done |
| CS-9 | Focused chat view (composer below thread, landing hides) | FE | 3 | ✅ Done |
| CS-10 | Intelligent intent routing + proactive recommendations | BE | 5 | ✅ Done |

### Epic 3 — Build-Anything Capabilities

| ID | Task | Area | Pts | Status |
|---|---|---|---|---|
| CS-11 | `build_site` → live in-chat website preview (Open/Download) | BE/FE | 5 | ✅ Done |
| CS-12 | `build_content` → editable, downloadable content card | BE/FE | 5 | ✅ Done |
| CS-13 | Publish-to-module (Markdown→Lexical draft + destination dropdown) | BE/FE | 5 | ✅ Done |
| CS-14 | `build_video` → script/storyboard + one-click render control | BE/FE | 5 | ✅ Done |
| CS-15 | `build_image` → real image generation (Replicate/Flux) + pipeline | BE/FE | 5 | ✅ Done |
| CS-16 | `build_brand` → verifiable brand card (publish/download) | BE/FE | 3 | ✅ Done |
| CS-17 | `build_theme` → live swatches + apply | BE/FE | 3 | ✅ Done |

### Epic 4 — Brand Studio

| ID | Task | Area | Pts | Status |
|---|---|---|---|---|
| CS-18 | Recommend → view → verify → publish/download flow | FE/BE | 5 | ✅ Done |
| CS-19 | Active Brand governs the agents (`isActive` + schema) | BE | 3 | ✅ Done |

### Epic 5 — Design System

| ID | Task | Area | Pts | Status |
|---|---|---|---|---|
| CS-20 | Prompt-driven, agent-governed theme + live preview + apply | BE/FE | 5 | ✅ Done |

### Epic 6 — Bilingual UI

| ID | Task | Area | Pts | Status |
|---|---|---|---|---|
| CS-21 | English/Arabic UI language switcher (RTL + translations) | FE | 5 | ✅ Done |

### Epic 7 — Platform, Cost and Infra

| ID | Task | Area | Pts | Status |
|---|---|---|---|---|
| CS-22 | Cost optimization — sub-agents on Haiku, orchestrator on Opus | BE | 3 | ✅ Done |
| CS-23 | Image/video render pipeline (Replicate) + proxy routes | BE | 3 | ✅ Done |
| CS-24 | Deploy + verification cycles (9 releases, live-tested) | INF | 5 | ✅ Done |

### Epic 8 — Customer Documentation

| ID | Task | Area | Pts | Status |
|---|---|---|---|---|
| CS-25 | Product Requirements Document (diagrams + product snapshots) | DOC | 3 | ✅ Done |
| CS-26 | UI/UX and User Journeys document | DOC | 3 | ✅ Done |
| CS-27 | High-Level Architecture document | DOC | 3 | ✅ Done |
| CS-28 | Combined Master Deck | DOC | 1 | ✅ Done |
| CS-29 | Branded PDF build pipeline + repo commit (PR #1 merged) | DOC/INF | 2 | ✅ Done |

**Totals:** 29 tasks · 121 points · **all ✅ Done.**

---

## 3. Task Highlights

- **One chat builds everything.** The agent intelligently decides and produces an interactive outcome — website, content, video, image, brand or theme — instead of a text dump.
- **Genuinely Claude-like.** Live token streaming, natural in-thread messages, converse-then-produce, recommendations, focused chat view.
- **Governed by construction.** Agents propose drafts; humans publish. Every agent action is audited; RBAC/ABAC enforced.
- **On-brand automatically.** A published "active brand" steers every generation; the design system is generated from a prompt.
- **Bilingual platform.** One-click English/Arabic UI switch with full RTL.
- **Cost-tuned.** Specialists/generation on Haiku, reasoning on Opus — credits last far longer.
- **Customer-ready collateral.** Four branded documents (PRD, UI/UX, Architecture, Deck) with real product snapshots, plus a reproducible build pipeline committed to the repo.

---

## 4. Release Plan Sheet

Each deployment to the live in-Kingdom environment is a release. All released from `main`, image rebuilt with per-commit cache-bust, verified live.

| Release | Date | Commit | Scope | Status |
|---|---|---|---|---|
| **R1** | 14 Jun | `aafdcf3` | Agentic core + conversational + live streaming | ✅ Released |
| **R2** | 14 Jun | `5e3b400` | Rich Markdown rendering + real website build + recommendations | ✅ Released |
| **R3** | 14 Jun | `3876aed` | Intelligent intent router + content artifact + publish-to-module | ✅ Released |
| **R4** | 14 Jun | `262e861` | Brand Studio loop + active-brand governance | ✅ Released |
| **R5** | 14 Jun | `7792480` | Design System — prompt-driven theme | ✅ Released |
| **R6** | 14 Jun | `c21fb2b` | Build set (video/image/brand/theme) + Claude-like chat UX | ✅ Released |
| **R6.1** | 14 Jun | `249a98d` | Brand-guideline palette fix | ✅ Released |
| **R7** | 14 Jun | `f734a2a` | Cost optimization (Haiku sub-agents) | ✅ Released |
| **R8** | 15 Jun | `4321000` | Customer collateral docs + build pipeline (PR #1 merged) | ✅ Released |
| **R9** | 15 Jun | `3a61950` | English/Arabic UI language switcher | ✅ Released |

**Release cadence:** continuous (multiple same-day releases), each build → deploy → live-verify.

---

## 5. Definition of Done — Verification

| Capability | Verified live |
|---|---|
| Conversational streaming + clarifying questions | ✅ "hi" converses; vague build asks a question |
| Multi-agent orchestration | ✅ Brand Guardian → Research → Build agents fire + audited |
| Build a website | ✅ 18 KB styled site rendered in-chat |
| Create + publish content | ✅ Draft created in `blogPosts` (Markdown→Lexical) |
| Brand recommend + palette + publish | ✅ Populated guideline (6-colour palette) + active-brand query |
| Prompt-driven theme | ✅ Distinct prompts → distinct themes |
| Cost optimization | ✅ Sub-agents on Haiku |
| Bilingual UI switch | ✅ EN/AR toggle + RTL (R9) |
| Documentation | ✅ 4 branded PDFs + pipeline committed |

---

## 6. Notes and External Dependencies

These do **not** affect delivered scope — all code is shipped and verified — but gate *live media rendering / model calls* on third-party billing:

- **Anthropic credit** powers the agents themselves. The platform degrades gracefully (friendly message) when the balance is exhausted.
- **Replicate credit** powers **real image/video file rendering** only (build_image / build_video render step). Scripts/cards generate without it; the actual media file needs credit.

**Suggested next-sprint candidates (not in scope this sprint):**
- Deepen UI string coverage for full Arabic localisation across all secondary screens.
- Real Payload migrations to replace first-boot schema push.
- Streaming for the rich artifact modes; expand the agent tool set (e.g., decks).

---

*Prepared for HUMAIN — Confidential. Sprint 1 "Agentic Studio" — delivered and deployed.*
