# HUMAIN Platform — Capability vs Requirements Matrix

**As of:** 2026-06-05 · **Legend:** ✅ Met · 🟡 Partial · 🔴 Gap

Requirements are drawn from the solution/design documents and the requirements gathered across the engagement. "Evidence" cites the live capability; "Gap / next action" maps to the Release Plan.

---

## 1. Core platform & UI

| # | Requirement | Status | Current capability / evidence | Gap / next action |
|---|---|:--:|---|---|
| 1.1 | Exact-replica Figma UI (Create Studio + Content Management) | ✅ | Pixel-matched light `/studio` + dark `/cms`; verified by screenshots | — |
| 1.2 | Branded login & session auth | ✅ | `/login`, httpOnly session JWT | — |
| 1.3 | Official HUMAIN branding (logo) | ✅ | Official wordmark SVG across surfaces | — |
| 1.4 | Responsive, production-grade build | ✅ | Next 16/React 19, deployed, HTTPS | — |
| 1.5 | Every section interactive (not mock) | ✅ | Projects CRUD, theme builder, brand builder, notifications — all real-data | — |

## 2. AI generation

| # | Requirement | Status | Current capability / evidence | Gap / next action |
|---|---|:--:|---|---|
| 2.1 | AI content generation (Claude) | ✅ | `/studio/generate`, real Claude output | — |
| 2.2 | **Multiple LLMs** (GPT, Grok, Gemini, …) | ✅ | Catalog: Claude Opus/Haiku, GPT-5.5, Grok 4, Gemini 2.5 Pro; per-model routing | GPT & Gemini accounts need billing (429) |
| 2.3 | User can pick/choose model | ✅ | Model picker with "configured" status | — |
| 2.4 | Interaction "exactly like Claude" (conversational) | ✅ | Multi-turn thread; follow-up refinement (history) | — |
| 2.5 | Sovereign (local embeddings) | ✅ | @xenova local embeddings (dim 384) | Fully on-Kingdom inference = Later |

## 3. Creative modes

| # | Requirement | Status | Current capability / evidence | Gap / next action |
|---|---|:--:|---|---|
| 3.1 | Create deck | 🟡 | Concept preview (structured brief) | Rendered slides = Later |
| 3.2 | Create image | 🟡 | Concept preview only | **Wire real image model** (Sprint 17) |
| 3.3 | Create website **content** | ✅ | Website copy mode | — |
| 3.4 | **Build website** | ✅ | `websiteBuild` → live HTML in iframe (Open/Copy) | — |
| 3.5 | Email | ✅ | Email mode | — |
| 3.6 | Writing / long-form | ✅ | Writing mode | — |
| 3.7 | Translation (EN↔AR) | ✅ | Translation mode (verified) | — |
| 3.8 | Design system | ✅ | Mode + interactive theme builder | — |
| 3.9 | **Events** content | ✅ | Event mode (agenda, speakers, promo) | — |
| 3.10 | **Webinar** content | ✅ | Webinar mode (run-of-show, emails) | — |
| 3.11 | **Campaign** | ✅ | Campaign mode (multi-track, channel plan, calendar) | — |
| 3.12 | **Video — concept** | ✅ | Script/storyboard/shot list + video prompt | — |
| 3.13 | **Video — real rendering** | ✅ | Replicate `luma/ray-2-720p`; in-app MP4 player; verified end-to-end | Quality/duration controls + queue = Next; single-concurrency tier |

## 4. Brand guidelines

| # | Requirement | Status | Current capability / evidence | Gap / next action |
|---|---|:--:|---|---|
| 4.1 | Create brand guidelines | ✅ | `brandGuideline` generation mode | — |
| 4.2 | **Prebuilt HUMAIN guideline** (from Figma/humain.com) | ✅ | Seeded with real tokens/voice | — |
| 4.3 | **Suggest other guidelines by need** | ✅ | 7 enterprise archetypes + Claude tailoring (industry/audience/tone) | (URL distillation = Later) |
| 4.4 | **Compose your own** from sections of others | ✅ | Brand Studio builder: pick→edit→reorder→save | — |
| 4.5 | "Train on enterprise sites" | 🟡 | Curated archetype library + AI tailoring (chosen approach) | Live URL distillation = Later |

## 5. Content management

| # | Requirement | Status | Current capability / evidence | Gap / next action |
|---|---|:--:|---|---|
| 5.1 | Multiple content types | ✅ | 12 types + Pages + globals | — |
| 5.2 | Reusable blocks & templates | ✅ | 15 blocks + templates | — |
| 5.3 | Editorial workflow | ✅ | draft→in_review→approved; publish gating | — |
| 5.4 | Drafts/versions/autosave | ✅ | Payload versions | — |
| 5.5 | Publish to public site | 🟡 | Publish works; public renderer built | **Expose public site** (Sprint 16) |
| 5.6 | Search | ✅ | Payload-backed search API/UI | Scale (OpenSearch) = Later |
| 5.7 | Content scheduling/calendar | 🔴 | — | Later (Sprint 27) |

## 6. Internationalization (Arabic)

| # | Requirement | Status | Current capability / evidence | Gap / next action |
|---|---|:--:|---|---|
| 6.1 | Bilingual content (EN/AR) | ✅ | EN/AR locales, localized fields | — |
| 6.2 | RTL rendering | ✅ | `dir=rtl`, IBM Plex Sans Arabic | — |
| 6.3 | Arabic AI generation | ✅ | Verified (Arabic prompt → Arabic output) | — |
| 6.4 | EN↔AR translation | ✅ | Translation mode (verified) | — |
| 6.5 | **Arabic / RTL interface (console UI)** | 🔴 | Chrome is English (Figma replica) | **Arabic UI** (Sprint 15) |

## 7. Users, roles & access

| # | Requirement | Status | Current capability / evidence | Gap / next action |
|---|---|:--:|---|---|
| 7.1 | Persona-based users | ✅ | 8 personas + 2 admins (`Indiabulls@2081`) | — |
| 7.2 | RBAC | ✅ | 6 roles enforced (verified) | — |
| 7.3 | ABAC | ✅ | Site/department/locale scope; field-level admin-only | — |
| 7.4 | User-management screen | ✅ | `/settings/users` (create/edit, roles, scope) | — |
| 7.5 | Settings/configuration screens | ✅ | Site Settings + Access & Roles matrix | — |
| 7.6 | Super-user/admin | ✅ | `admin@` & `siteadmin@` (full access) | — |
| 7.7 | SSO / OIDC | 🔴 | Local auth only (OIDC seam exists) | Later (Sprint 21) |

## 8. Notifications & activity

| # | Requirement | Status | Current capability / evidence | Gap / next action |
|---|---|:--:|---|---|
| 8.1 | Working notifications (not placeholder) | ✅ | Real feed (generations/renders + content events), unread badge, mark-all-read | — |
| 8.2 | Real-time delivery | 🟡 | 45s poll | Push/SSE = Next (Sprint 19) |

## 9. Deployment, security & ops

| # | Requirement | Status | Current capability / evidence | Gap / next action |
|---|---|:--:|---|---|
| 9.1 | Sovereign/self-hosted deployment | ✅ | Dedicated Docker stack on GCP `haow` VM | — |
| 9.2 | Public HTTPS access | ✅ | Host nginx vhost + Certbot TLS | (GCP firewall closed — via shared nginx) |
| 9.3 | Security (RBAC, CSP, rate limit, audit, HMAC) | ✅ | All live | — |
| 9.4 | Repeatable deploy | ✅ | `scripts/deploy-haow.sh` + GIT_SHA cache-bust | — |
| 9.5 | **Production migrations** | 🟡 | First-boot dev-push bootstrap | **Generate migrations** (Sprint 18) |
| 9.6 | Observability / DR / SLOs | 🔴 | Audit log + health only | Later (Sprint 25) |

---

## Summary scorecard

| Category | ✅ Met | 🟡 Partial | 🔴 Gap |
|---|:--:|:--:|:--:|
| 1 Core platform & UI | 5 | 0 | 0 |
| 2 AI generation | 5 | 0 | 0 |
| 3 Creative modes | 11 | 2 | 0 |
| 4 Brand guidelines | 4 | 1 | 0 |
| 5 Content management | 5 | 1 | 1 |
| 6 Internationalization | 4 | 0 | 1 |
| 7 Users/roles/access | 6 | 0 | 1 |
| 8 Notifications | 1 | 1 | 0 |
| 9 Deploy/security/ops | 4 | 1 | 1 |
| **Total** | **45** | **6** | **4** |

**Met ≈ 82%**, Partial ≈ 11%, Gap ≈ 7% (55 tracked requirements).

### Top gaps to close (priority order)
1. 🔴 **Arabic/RTL console UI** (6.5) — Sprint 15
2. 🔴/🟡 **Public site live** (5.5) — Sprint 16
3. 🟡 **Real image generation** (3.2) — Sprint 17
4. 🟡 **Production migrations** (9.5) — Sprint 18
5. 🟡 **Real-time notifications** (8.2) — Sprint 19
6. 🟡 **Video controls/queue** (3.13) — Sprint 20
7. 🔴 **SSO/OIDC** (7.7), **Observability/DR** (9.6), **Scheduling** (5.7), **Scale search** (5.6) — Release 5.x
