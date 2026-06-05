# HUMAIN Platform — Release Plan (Sprints & Tasks)

**As of:** 2026-06-05 · **Cadence:** 2-week sprints · **Status legend:** ✅ Done · 🔄 In progress · 🔜 Planned

Roles: **FE** front-end, **BE** back-end/Payload, **AI** ai-service, **DevOps**, **QA**, **PM/Brand**.

> Sprints 1–14 are **delivered and live**; they document the build that produced the current product. Sprints 15+ are **planned** against the gaps in the Capability-vs-Requirements matrix.

---

## RELEASE 1.x — Foundation (✅ Shipped)

### Sprint 1 — Foundation & data model ✅
**Goal:** Payload boots, schema, seed, security baseline.
- BE: Payload 3.85 config, Postgres+pgvector, Users/Sites/Media/Pages/Projects/AuditLog collections.
- BE: seed (admin, site, bilingual home page); audit-log hooks.
- DevOps: pnpm workspace, local stack (host-port remap PG 5433 / Redis 6380).
- **AC:** `/admin` 200, 100+ tables, seed idempotent. **QA:** boot + seed verified.

### Sprint 2 — Auth + exact-replica surfaces ✅
**Goal:** Login → session → both Figma surfaces.
- FE: branded `/login`; light `/studio` (Create Studio); dark `/cms` (Content Management) — pixel-matched.
- BE/FE: session JWT in httpOnly `humain-token` cookie; `/api/auth/login|logout`.
- **AC:** login→session→surfaces render; screenshots match Figma. **QA:** real publish path.

### Sprint 3 — Content types, blocks, workflow, public render ✅
**Goal:** Full content backend + public bilingual render.
- BE: 12 content types + globals; 15 blocks; editorial workflow (draft→in_review→approved).
- AI: Claude generation pipeline (`/studio/generate`), local embeddings.
- FE/web: public site EN + AR/RTL block renderer.
- **AC:** create→publish→render (EN/AR); reviewer/publisher gating.

### Sprint 4 — Search, integrations, deploy ✅
**Goal:** Search + analytics + production deploy.
- FE/BE: search API/UI; GA4/GTM injection; MCP server (read + draft-only).
- DevOps: Dockerfile, `docker-compose.prod.yml`, nginx + CSP, CI/CD, deploy to haow VM; Certbot TLS; shared-nginx vhost.
- **AC:** live at HTTPS sslip host; login→publish→search verified live.

---

## RELEASE 2.x — Personas, governance, brand, interactivity (✅ Shipped)

### Sprint 5 — Personas + RBAC + ABAC ✅
- BE: 8 persona users (`Indiabulls@2081`, env-supplied) + 2 admins; RBAC (6 roles); ABAC (site/department/locale scope); deactivated-login block; admin-only sensitive fields.
- QA: author cannot publish, publisher can; wrong pw → 401; all personas verified live.
- *(Gotcha fixed: drizzle 0.45 two-hasMany-select bug → locales stored as json.)*

### Sprint 6 — Brand refinement + working prompt box ✅
- FE: official HUMAIN logo (SVG); expanded/collapsible "Create Studio" sidebar.
- FE: prompt box (+ menu, file chips, image ratio/style, deck HTML/Image, suggestions); Content Management launcher grid → per-type forms; user-management + Site Settings + Access matrix screens.

### Sprint 7 — Interactive Projects + Design System builder ✅
- FE/BE: Projects CRUD (New-project modal, delete); Design System **theme builder** (color/type/radius, save to Settings global).
- FE: quick-create **real preview thumbnails**; Create-new options menu; "← Create Studio" back link + account menu.
- DevOps: **GIT_SHA cache-bust** deploy fix (stale-layer bug); "push before deploy" rule.

---

## RELEASE 3.x — Multi-LLM, studio expansion, video, notifications (✅ Shipped)

### Sprint 8 — Multi-model LLM ✅
- AI: provider registry (Anthropic + generic OpenAI-compat); model catalog (Claude/GPT/Grok/Gemini); `/models` + per-model routing; embeddings stay local.
- FE: catalog-driven model picker (greys "key needed"). QA: each model routes to its own provider (Grok ≠ silent Claude).

### Sprint 9 — Studio expansion (Wave A) ✅
- AI: new modes — event, webinar, campaign, brandGuideline, **websiteBuild (raw HTML)**, **video (concept)**; video render pipeline (`/video/render`+`/video/status`, pluggable provider).
- FE: prompt box gains all modes; **HTML live-preview iframe**; video render panel; Projects enum extended; CSP media-src/frame-src.
- QA: all modes generate real output live; flags (html/video) correct.

### Sprint 10 — Brand Studio (Wave B) ✅
- BE: `BrandGuidelines` collection; seed HUMAIN guideline + 7 archetypes.
- FE/BE: `/api/brand-guidelines` (list/save/delete) + `/suggest` (Claude → parsed sections+palette); **Brand Studio** UI (library, AI tailoring, compose-your-own builder).
- QA: 8 archetypes seeded; suggest parses cleanly; save round-trips.

### Sprint 11 — Claude-like conversation (Wave C) ✅
- AI/FE: `/studio/generate` accepts `history[]`; prompt box becomes a **multi-turn thread** (user/assistant turns, follow-up refinement).
- QA: turn-2 refined turn-1's exact output (context verified).

### Sprint 12 — Real video rendering ✅
- AI: wire **Replicate** (`luma/ray-2-720p`; Luma Agents path also implemented); official-model endpoint; `pickUrl` string-output fix.
- DevOps: `VIDEO_*` env; key set; ai-service recreated.
- QA: real MP4 rendered end-to-end (direct + in-app + UI `<video>` player). *Constraints: single-concurrency tier; variable render time (30s–7min).*

### Sprint 13 — Notifications ✅
- BE: `Users.notificationsReadAt`; `/api/notifications` (feed from Projects + AuditLog) + `/api/notifications/read`.
- FE: `NotificationsBell` (sidebar + top bar), unread badge, per-item dots, mark-all-read, 45s poll.
- QA: 20/20 unread → mark read → 0; live screenshot.

### Sprint 14 — Polish: titles & ordering ✅
- BE: `deriveTitle()` — clean project titles from output (heading/`<title>`/first line; skip error artifacts); backfill existing projects.
- FE: Projects sort by **creation date**.
- QA: Projects page shows clean titles, newest-first.

---

## RELEASE 4.x — Arabic UI, public site, image gen (🔜 Planned, Q3 2026)

### Sprint 15 — Arabic / RTL console UI
- FE: extract UI strings; AR locale bundle; `dir="rtl"` layout mirroring for sidebar/top bar/forms; language switcher in account menu.
- FE: RTL-correct components (menus, toasts, prompt box).
- **AC:** full console usable in Arabic RTL; EN/AR toggle persists per user. **Owner:** FE, PM/Brand. **Est:** 1 sprint.

### Sprint 16 — Public bilingual site live
- DevOps: subdomain vhost (e.g. `www.…sslip.io`) → `apps/web`; Certbot cert; compose `full` profile for `web`.
- FE/BE: publish→revalidate webhook to web; SEO/sitemap EN/AR.
- **AC:** published content renders publicly EN + AR/RTL at a stable URL. **Owner:** DevOps, FE.

### Sprint 17 — Real image generation
- AI: image provider (e.g. Replicate FLUX / image model) behind the existing image mode; ratio/style → params.
- FE: image result gallery + download; persist to Media/Projects.
- **AC:** "Create Image" returns a real rendered image (not concept). **Owner:** AI, FE.

---

## RELEASE 4.1 — Hardening (🔜 Planned, Q3 2026)

### Sprint 18 — Production migrations
- BE: `payload migrate` generation; remove first-boot dev-push; deploy runs migrations.
- DevOps: migration step in deploy script; rollback runbook.
- **AC:** schema changes ship via versioned migrations; no dev-push in prod.

### Sprint 19 — Real-time notifications + event/webinar scheduling
- BE/FE: SSE or webhook push for notifications (replace 45s poll); read-state per device.
- BE: scheduled reminders for Events/Webinars (registration/reminder/follow-up automation).
- **AC:** notifications appear < 5s; webinar reminder emails scheduled.

### Sprint 20 — Video controls & resilience
- AI/FE: per-render **model (ray-flash/ray-2)**, **duration (5s/9s)**, **aspect-ratio** controls; queue with retry/backoff for single-concurrency tier.
- **AC:** user picks quality/length; renders queue gracefully; cost shown.

---

## RELEASE 5.x — Enterprise scale (🌅 Planned, Q4 2026 → Q1 2027)

### Sprint 21–22 — SSO/OIDC + SCIM
- BE: OIDC via Keycloak (the seam exists); SCIM user provisioning; map IdP groups → roles.
- **AC:** enterprise SSO login; automated joiner/mover/leaver.

### Sprint 23–24 — Scale search (OpenSearch + pgvector hybrid)
- AI/DevOps: deploy OpenSearch + MinIO + RAG/index workers (already coded, behind `full` profile); hybrid lexical+vector search.
- **AC:** sub-second search at scale; semantic + faceted.

### Sprint 25–26 — Observability, DR, SLOs
- DevOps: metrics/tracing/log aggregation; backups + restore drills; autoscaling; documented SLOs.
- **AC:** dashboards live; backup/restore tested; SLOs measured.

### Sprint 27–28 — Multi-tenant, scheduling, brand enforcement, model routing
- BE: multi-site/tenant isolation; content calendar/scheduling.
- AI: brand-conformance grading at generation time; model-routing policies (cost/quality/sovereignty); eval/promotion gate.
- **AC:** multiple brands isolated; content scheduled; output auto-graded vs brand.

---

## Cross-cutting (every sprint)
- **Definition of Done:** `tsc --noEmit` (studio+cms+ai-service) clean · committed & **pushed before deploy** · deployed via `scripts/deploy-haow.sh` · **verified live** · memory/docs updated.
- **Risk controls:** GIT_SHA cache-bust on every deploy; graceful provider-error handling (⚠️ artifacts); rate limiting; CSP.
