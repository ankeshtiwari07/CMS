# HUMAIN Platform — Product Roadmap

**As of:** 2026-06-05 · Horizons are indicative (2-week sprints; ~Q = 3 months).

This roadmap is organized by **strategic themes** across **Now / Next / Later** horizons. "Now-shipped" reflects what is already live in production.

---

## Strategic themes

| Theme | Why it matters |
|---|---|
| **T1 — On-brand creation** | Generation that is HUMAIN-branded by default; brand systems as first-class objects |
| **T2 — Arabic-first & sovereignty** | Bilingual content + interface; data and models under national control |
| **T3 — Multi-model intelligence** | Best model per task; resilience; cost/quality control |
| **T4 — Rich creative (beyond text)** | Web builds, brand systems, images, and video |
| **T5 — Content lifecycle & governance** | Workflow, RBAC/ABAC, audit, publishing |
| **T6 — Enterprise readiness** | SSO, migrations, scale search, observability, SLAs |

---

## Horizon view

### ✅ NOW — Shipped (live in production, Q2 2026)

| Theme | Delivered |
|---|---|
| T1 | Brand Studio (HUMAIN guideline + 7 archetypes + AI tailoring + compose-your-own); Design System theme builder |
| T2 | Bilingual content (EN/AR + RTL), Arabic generation, EN↔AR translation mode, locale-scoped users |
| T3 | Multi-model picker (Claude/GPT/Grok/Gemini), provider registry, local embeddings |
| T4 | Website **build** (live HTML), deck/image concept, **real video rendering** (Replicate/Luma Ray 2) |
| T5 | 12 content types + workflow (draft→review→publish), RBAC(6)+ABAC, audit log, notifications |
| T6 | Dockerized deploy on sovereign VM, HTTPS, persona users, user management, settings |

### 🔜 NEXT — Committed (Q3 2026)

| Theme | Item |
|---|---|
| T2 | **Arabic / RTL console UI** localization (interface, not just content) |
| T4 | **Real image generation** (wire an image model alongside video) |
| T4 | **Public bilingual site** live on a subdomain (expose `apps/web` EN/AR) |
| T6 | **Production Payload migrations** (replace first-boot dev-push) |
| T3 | Fund/enable GPT & Gemini (billing), add per-render **quality/duration controls** for video |
| T5 | Notifications: real-time (webhook/SSE) + scheduling/reminders for events & webinars |

### 🌅 LATER — Planned (Q4 2026 → Q1 2027)

| Theme | Item |
|---|---|
| T6 | **SSO/OIDC** (Keycloak), SCIM provisioning |
| T6 | **Scale search** — deploy OpenSearch + pgvector hybrid (RAG workers) |
| T4 | Deck → rendered slides; image editing; brand-locked asset generation |
| T1 | Brand-guideline enforcement at generation time (auto-grade output vs brand) |
| T5 | Multi-site / multi-tenant; content scheduling & calendars |
| T6 | Observability stack (metrics/tracing), SLOs, autoscaling; DR/backups |
| T3 | Model routing policies (cost/quality/sovereignty rules), eval/promotion gate |
| T4 | Campaign orchestration (assets → channels → analytics loop) |

---

## Release train (summary — see Release Plan for detail)

| Release | Theme focus | Status |
|---|---|---|
| R1.0–1.3 | Foundation, auth, content, AI, deploy | ✅ Shipped |
| R2.0–2.1 | Personas/RBAC/ABAC, Brand, interactivity | ✅ Shipped |
| R3.0–3.2 | Multi-LLM, studio expansion, video, notifications | ✅ Shipped |
| **R4.0** | Arabic UI + public site + image gen | 🔜 Next |
| **R4.1** | Migrations, real-time notifications, video controls | 🔜 Next |
| **R5.0** | SSO/SCIM, scale search, observability | 🌅 Later |
| **R5.1** | Multi-tenant, scheduling, brand enforcement, model routing | 🌅 Later |

---

## Guiding principles

1. **Sovereign by default** — local embeddings; configurable LLM; no mandatory egress.
2. **On-brand by default** — brand context flows into generation.
3. **Bilingual everywhere** — EN/AR parity is a requirement, not an add-on.
4. **Real, not mock** — every surface is wired to real data/pipelines.
5. **Ship in waves** — each release is independently deployable and verified live.
