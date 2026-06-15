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
| **Environment** | In-Kingdom VM · https://cms.34-14-150-134.sslip.io |
| **Status** | ✅ Delivered |

---

## 1. Programme Overview

Delivered as **five focused sprints in a compressed one-week programme** — each sprint owns its releases and tasks, builds on the previous, and shipped to the live in-Kingdom environment.

| Sprint | Focus | Releases | Tasks | Points | Status |
|---|---|---|---|---|---|
| **S1** | Agentic Foundation | R1 | 6 | 28 | ✅ Delivered |
| **S2** | Intelligent Build — Web and Content | R2, R3 | 5 | 23 | ✅ Delivered |
| **S3** | Brand and Design | R4, R5 | 3 | 13 | ✅ Delivered |
| **S4** | Full Build Set and Claude-like UX | R6, R6.1 | 7 | 25 | ✅ Delivered |
| **S5** | Cost, Localization and Delivery | R7, R8, R9 | 8 | 25 | ✅ Delivered |
| **Total** | | **10** | **29** | **114** | **100%** |

> **Programme result: 100% of committed scope delivered and deployed across 5 sprints.** Two capabilities have a live-render dependency on external billing (§4); all code is shipped and verified.

---

## 2. Sprints

Legend: **✅ Done** · Area: BE = backend · FE = frontend (Studio) · INF = infra/deploy · DOC = documentation.

### 2.1 S1 — Agentic Foundation
**Goal:** Stand up the agentic core (orchestrator + governed tools + specialists) and conversational, live-streaming chat. · **Releases:** R1 · **28 pts**

| ID | Task | Area | Release | Pts | Status |
|---|---|---|---|---|---|
| CS-1 | Orchestrator agent + Claude tool-use loop | BE | R1 | 8 | ✅ Done |
| CS-2 | Governed tools (RAG + brand) | BE | R1 | 5 | ✅ Done |
| CS-3 | Specialist agents (draft/localize/brand/SEO/editorial/research) | BE | R1 | 5 | ✅ Done |
| CS-4 | Per-run audit logging | BE | R1 | 2 | ✅ Done |
| CS-5 | Streaming chat endpoint (SSE) | BE | R1 | 5 | ✅ Done |
| CS-6 | Converse-then-produce + clarifying questions | BE | R1 | 3 | ✅ Done |

### 2.2 S2 — Intelligent Build — Web and Content
**Goal:** Intelligent intent routing; build real websites and editable, publishable content; rich rendering. · **Releases:** R2, R3 · **23 pts**

| ID | Task | Area | Release | Pts | Status |
|---|---|---|---|---|---|
| CS-7 | Rich Markdown rendering | FE | R2 | 3 | ✅ Done |
| CS-11 | build_site → live in-chat website preview | BE/FE | R2 | 5 | ✅ Done |
| CS-10 | Intent routing + recommendations | BE | R3 | 5 | ✅ Done |
| CS-12 | build_content → editable content card | BE/FE | R3 | 5 | ✅ Done |
| CS-13 | Publish-to-module (Markdown→Lexical draft) | BE/FE | R3 | 5 | ✅ Done |

### 2.3 S3 — Brand and Design
**Goal:** Brand Studio recommend→publish loop with active-brand governance; prompt-driven design system. · **Releases:** R4, R5 · **13 pts**

| ID | Task | Area | Release | Pts | Status |
|---|---|---|---|---|---|
| CS-18 | Recommend→view→verify→publish flow | FE/BE | R4 | 5 | ✅ Done |
| CS-19 | Active Brand governs the agents | BE | R4 | 3 | ✅ Done |
| CS-20 | Prompt-driven, agent-governed theme | BE/FE | R5 | 5 | ✅ Done |

### 2.4 S4 — Full Build Set and Claude-like UX
**Goal:** Build video, image, brand and theme from chat; natural Claude-style messages and a focused chat view. · **Releases:** R6, R6.1 · **25 pts**

| ID | Task | Area | Release | Pts | Status |
|---|---|---|---|---|---|
| CS-8 | Natural messages + Copy/Retry action row | FE | R6 | 3 | ✅ Done |
| CS-9 | Focused chat view (composer below thread) | FE | R6 | 3 | ✅ Done |
| CS-14 | build_video → script/storyboard + render | BE/FE | R6 | 5 | ✅ Done |
| CS-15 | build_image → real image (Replicate/Flux) | BE/FE | R6 | 5 | ✅ Done |
| CS-16 | build_brand → verifiable brand card | BE/FE | R6 | 3 | ✅ Done |
| CS-17 | build_theme → live swatches + apply | BE/FE | R6 | 3 | ✅ Done |
| CS-23 | Image/video render pipeline (Replicate) | BE | R6 | 3 | ✅ Done |

### 2.5 S5 — Cost, Localization and Delivery
**Goal:** Cost optimization, English/Arabic UI, customer documentation, and continuous delivery. · **Releases:** R7, R8, R9 · **25 pts**

| ID | Task | Area | Release | Pts | Status |
|---|---|---|---|---|---|
| CS-22 | Cost optimization (Haiku sub-agents) | BE | R7 | 3 | ✅ Done |
| CS-25 | Product Requirements Document | DOC | R8 | 3 | ✅ Done |
| CS-26 | UI/UX and User Journeys document | DOC | R8 | 3 | ✅ Done |
| CS-27 | High-Level Architecture document | DOC | R8 | 3 | ✅ Done |
| CS-28 | Combined Master Deck | DOC | R8 | 1 | ✅ Done |
| CS-29 | Branded PDF pipeline + repo commit (PR #1) | DOC/INF | R8 | 2 | ✅ Done |
| CS-21 | English/Arabic UI language switcher | FE | R9 | 5 | ✅ Done |
| CS-24 | Deploy + verification cycles (spans R1–R9) | INF | R1–R9 | 5 | ✅ Done |

---

## 3. Release Plan Sheet

Each deployment to the live in-Kingdom environment is a release, mapped to its sprint. All released from `main`, image rebuilt with per-commit cache-bust, verified live.

| Release | Date | Commit | Sprint | Scope | Status |
|---|---|---|---|---|---|
| **R1** | 14 Jun | `aafdcf3` | S1 | Agentic core + conversational + live streaming | ✅ Released |
| **R2** | 14 Jun | `5e3b400` | S2 | Rich Markdown rendering + website build + recommendations | ✅ Released |
| **R3** | 14 Jun | `3876aed` | S2 | Intent router + content artifact + publish-to-module | ✅ Released |
| **R4** | 14 Jun | `262e861` | S3 | Brand Studio loop + active-brand governance | ✅ Released |
| **R5** | 14 Jun | `7792480` | S3 | Design System — prompt-driven theme | ✅ Released |
| **R6** | 14 Jun | `c21fb2b` | S4 | Build set (video/image/brand/theme) + Claude-like chat UX | ✅ Released |
| **R6.1** | 14 Jun | `249a98d` | S4 | Brand-guideline palette fix | ✅ Released |
| **R7** | 14 Jun | `f734a2a` | S5 | Cost optimization (Haiku sub-agents) | ✅ Released |
| **R8** | 15 Jun | `4321000` | S5 | Customer collateral docs + build pipeline (PR #1) | ✅ Released |
| **R9** | 15 Jun | `3a61950` | S5 | English/Arabic UI language switcher | ✅ Released |

---

## 4. Definition of Done — Verification

| Capability | Sprint | Verified live |
|---|---|---|
| Conversational streaming + clarifying questions | S1 | ✅ "hi" converses; vague build asks a question |
| Multi-agent orchestration | S1 | ✅ Brand Guardian → Research → Build agents fire + audited |
| Build a website | S2 | ✅ 18 KB styled site rendered in-chat |
| Create + publish content | S2 | ✅ Draft created in `blogPosts` (Markdown→Lexical) |
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
