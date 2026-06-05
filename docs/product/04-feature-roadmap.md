# HUMAIN Platform — Feature Roadmap

**As of:** 2026-06-05 · **Status:** ✅ Live · 🔄 In progress · 🔜 Next (Q3'26) · 🌅 Later (Q4'26+)

A feature-level view (what a user can do), mapped to delivery horizons. For the capability-vs-requirement gap analysis see the Matrix doc.

---

## A. Create Studio (generation)

| Feature | Status | Notes |
|---|---|---|
| Prompt-driven generation | ✅ Live | Real Claude output |
| Multi-turn conversation (follow-up refinement) | ✅ Live | Sends history for context |
| Model picker (Claude/GPT/Grok/Gemini) | ✅ Live | Catalog-driven, "key needed" state |
| Writing / article generation | ✅ Live | |
| Translation (EN↔AR) | ✅ Live | |
| Email generation | ✅ Live | |
| Website **copy** | ✅ Live | |
| Website **build (live HTML)** | ✅ Live | Rendered in iframe, Open/Copy |
| Design system generation | ✅ Live | |
| Event content | ✅ Live | |
| Webinar content | ✅ Live | |
| Campaign builder | ✅ Live | Multi-track, channel plan, calendar |
| Brand guideline generation | ✅ Live | |
| Deck (concept) | ✅ Live | Concept preview |
| Image (concept) | ✅ Live | Concept preview |
| **Image (real render)** | 🔜 Next | Wire an image model |
| **Deck (rendered slides)** | 🌅 Later | |
| Voice input (speech-to-text) | ✅ Live | Chrome/Edge |
| File upload as context | ✅ Live | Text files parsed into prompt |
| Type-ahead suggestions | ✅ Live | |

## B. Video

| Feature | Status | Notes |
|---|---|---|
| Video concept (script/storyboard/shot list) | ✅ Live | |
| **Real video render (MP4)** | ✅ Live | Replicate `luma/ray-2-720p`; in-app player |
| Render queue / retry (single-concurrency tier) | 🔜 Next | |
| Quality (ray-flash/ray-2) + duration + aspect controls | 🔜 Next | |
| Provider choice (Luma Agents / Replicate) | ✅ Live | Pluggable; Replicate active |

## C. Brand Studio

| Feature | Status | Notes |
|---|---|---|
| Prebuilt HUMAIN guideline | ✅ Live | Real tokens & voice |
| Archetype library (7 enterprise archetypes) | ✅ Live | Sovereign, SaaS, finance, luxury, telecom, healthcare, startup |
| AI-tailored guideline (by industry/audience/tone) | ✅ Live | Parsed into editable sections + palette |
| Compose-your-own (pick sections, edit/reorder, save) | ✅ Live | BrandGuidelines collection |
| URL distillation (paste a brand URL → guideline) | 🌅 Later | |
| Brand-conformance grading of generated output | 🌅 Later | |

## D. Content Management

| Feature | Status | Notes |
|---|---|---|
| 12 content types + Pages + globals | ✅ Live | |
| 15 content blocks + templates | ✅ Live | |
| Per-type creation forms | ✅ Live | Launcher grid |
| Editorial workflow (draft→review→approved) | ✅ Live | Reviewer/publisher gating |
| Draft/publish + versions/autosave | ✅ Live | Payload |
| Bilingual content (EN/AR) + RTL | ✅ Live | |
| Content scheduling / calendar | 🌅 Later | |
| Multi-site / multi-tenant | 🌅 Later | |

## E. Platform & governance

| Feature | Status | Notes |
|---|---|---|
| Branded login + session | ✅ Live | |
| RBAC (6 roles) | ✅ Live | |
| ABAC (site/department/locale scope) | ✅ Live | |
| User management screen | ✅ Live | |
| Site Settings + Access & Roles matrix | ✅ Live | |
| Design System theme builder (saved) | ✅ Live | |
| Projects (CRUD, clean titles, ordering) | ✅ Live | |
| Search | ✅ Live | Payload-backed |
| **Notifications (real feed)** | ✅ Live | Generations/renders + content events |
| Notifications real-time (push/SSE) | 🔜 Next | Currently 45s poll |
| Audit log | ✅ Live | |
| Rate limiting, CSP, security headers, HMAC webhooks | ✅ Live | |
| **SSO / OIDC** | 🌅 Later | Seam exists (Keycloak) |
| SCIM provisioning | 🌅 Later | |

## F. Internationalization

| Feature | Status | Notes |
|---|---|---|
| Bilingual content model (EN/AR locales) | ✅ Live | |
| RTL content rendering | ✅ Live | |
| Arabic AI generation | ✅ Live | |
| EN↔AR translation mode | ✅ Live | |
| **Arabic / RTL console UI** | 🔜 Next | Chrome currently English |

## G. Public & distribution

| Feature | Status | Notes |
|---|---|---|
| Public site renderer (EN/AR, RTL) | ✅ Built | In `apps/web` |
| **Public site live on URL** | 🔜 Next | Needs subdomain vhost |
| GA4 / GTM analytics injection | ✅ Live | |
| On-demand revalidation (HMAC) | ✅ Live | |

## H. Deployment & ops

| Feature | Status | Notes |
|---|---|---|
| Dockerized stack on sovereign VM | ✅ Live | |
| HTTPS (Let's Encrypt, auto-renew) | ✅ Live | |
| Deploy script (IAP, GIT_SHA cache-bust) | ✅ Live | |
| **Production migrations** | 🔜 Next | Replace dev-push bootstrap |
| Scale search (OpenSearch + pgvector) | 🌅 Later | Coded, behind `full` profile |
| Observability / DR / SLOs / autoscaling | 🌅 Later | |
