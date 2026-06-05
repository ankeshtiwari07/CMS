# HUMAIN Create Studio & Content Platform — Product Document

**Status:** Live (production) · **As of:** 2026-06-05 · **Owner:** Product
**Environment:** https://cms.34-14-150-134.sslip.io · **Source:** github.com/ankeshtiwari07/CMS

---

## 1. Vision

An **AI-native, sovereign content & creative platform** for HUMAIN — Saudi Arabia's sovereign-AI champion — that lets enterprise and government teams **create on-brand content, creative, and campaigns** (text, web, brand systems, and video) and **manage their full content lifecycle**, with Arabic-first capability and data that stays in the Kingdom.

> *"Frontier creative and content production, sovereign by design and human at heart."*

## 2. Problem

Enterprise/government marketing, comms and product teams need to produce a high volume of **on-brand, bilingual (Arabic/English)** content and creative across many channels (web, email, events, webinars, campaigns, video), but:

- General AI tools are not on-brand, not Arabic-first, and not sovereign (data leaves the country).
- Content production and content management live in disconnected tools.
- Brand consistency is hard to enforce at scale.
- Video and rich creative require separate specialist tooling.

## 3. Target users & personas

| Persona | Role | Primary needs |
|---|---|---|
| **Content Author** (`author`) | Marketing/Comms creator | Generate & draft content fast, on-brand, EN/AR |
| **Reviewer** (`reviewer`) | Editor | Review and approve drafts |
| **Publisher** (`publisher`) | Managing editor | Publish; manage site settings/themes |
| **Brand Lead** (`brand`) | Brand owner | Brand guidelines, design system, voice |
| **Viewer** (`viewer`) | Stakeholder | Read published content |
| **Administrator** (`admin`) | Platform owner | User management, RBAC/ABAC, configuration |

Personas are seeded and live (`*@humain.sa`), each with role-appropriate access.

## 4. Value proposition

1. **On-brand by default** — a built-in HUMAIN brand guideline + a Brand Studio that grounds generation in brand voice, palette and typography.
2. **Arabic-first** — bilingual content model (EN/AR locales, RTL), EN↔AR translation, native Arabic generation.
3. **Multi-model AI** — pick Claude, GPT, Grok or Gemini per task; embeddings run locally (sovereign).
4. **End-to-end** — generate → refine conversationally → manage → review → publish, in one platform.
5. **Rich creative** — not just text: live website builds (HTML), brand systems, and **real rendered video**.
6. **Sovereign deployment** — self-hosted on national infrastructure; local embeddings; no mandatory data egress.

## 5. Product surfaces

| Surface | Route | Description |
|---|---|---|
| **Login** | `/login` | Branded auth (email+password, OIDC-ready seam) |
| **Create Studio** (light) | `/studio` | Conversational creation: prompt box, modes, model picker, quick-create |
| **Projects** | `/projects` | All generated assets (CRUD, clean titles, open/delete) |
| **Brand Studio** | `/brand` | Brand-guideline library + AI tailoring + compose-your-own builder |
| **Design System** | `/design` | Interactive theme builder (colors/type/radius), saved to settings |
| **Search** | `/search` | Content search across collections |
| **Content Management** (dark) | `/cms`, `/cms/manage` | Launcher grid → per-type forms → draft/publish |
| **Settings** | `/settings/*` | User management · Site settings · Access & Roles matrix |
| **Admin (Payload)** | `/admin` | Break-glass headless CMS admin |

## 6. Capabilities (built & live)

### 6.1 Create Studio (generation)
- **Conversational prompt box** — multi-turn refinement (sends history for context), composer clears on send, "Ask a follow-up".
- **Modes:** writing, deck (concept), image (concept), **websiteBuild (live HTML preview)**, website copy, email, translation (EN↔AR), designSystem, **event**, **webinar**, **campaign**, **brandGuideline**, **video** (script/storyboard concept + real render).
- **Multi-model picker** — Claude Opus 4.8 / Haiku 4.5, GPT-5.5, Grok 4, Gemini 2.5 Pro; catalog-driven with live "configured" status.
- **Input:** + menu (files, recent, create types), file-upload chips, image ratio/style, deck HTML/Image, voice input (webkitSpeechRecognition), type-ahead suggestions.
- **Output:** live HTML iframe (website builds), in-app video player (renders), copy/open, persisted as Projects.

### 6.2 Video
- **Concept** — logline, scene-by-scene script, shot list, storyboard, music/pacing, a text-to-video prompt.
- **Real rendering** — pluggable provider (Replicate `luma/ray-2-720p`; Luma Agents path also wired), start → poll → MP4 player in-app.

### 6.3 Brand Studio
- **Prebuilt HUMAIN guideline** (real tokens & voice) + **7 enterprise archetypes** (sovereign, enterprise-SaaS, financial, luxury, telecom, healthcare, bold-startup).
- **AI tailoring** — Claude generates a guideline from industry/audience/tone, parsed into editable sections + palette.
- **Compose-your-own** — pick sections from any guideline, edit/reorder, save (BrandGuidelines collection).

### 6.4 Content Management
- **12 content types** (Articles, BlogPosts, PressReleases, Events, Products, CaseStudies, Leadership, FAQs, MediaGalleries, CampaignMicrosites, Careers) + Pages; **15 blocks**; templates; per-type forms.
- **Editorial workflow** — draft → in_review → approved; reviewer/publisher gating; Payload draft/publish + versions.
- **Bilingual** — EN/AR locales, RTL, IBM Plex Sans Arabic.

### 6.5 Platform
- **AuthN/Z** — session JWT (httpOnly), **RBAC** (6 roles), **ABAC** (site/department/locale scope), deactivated-login block.
- **Admin tooling** — user management, Site Settings, Access & Roles matrix, **theme builder**.
- **Notifications** — real activity feed (generations/renders + content events), unread badge, mark-all-read.
- **Search**, **Projects**, **Audit log**, **HMAC revalidation webhooks**, **rate limiting**, **CSP/security headers**.

## 7. Architecture (summary)

```
Browser ──HTTPS──> host nginx (sslip.io + Certbot TLS)
                        └─> CMS nginx (:8030, CSP/headers)
                              ├─> console  (apps/studio, Next 16 — UI + API routes)
                              ├─> cms      (apps/cms, Payload 3.85 — content API + /admin)
                              ├─> ai-service (Fastify — multi-LLM router, local embeddings, video pipeline)
                              ├─> postgres (+ pgvector)   └─> redis
                              └─> web      (apps/web — public EN/AR site; behind full profile)
```

- **Monorepo:** pnpm workspace. **Stack:** Payload 3.85, Next.js 16.2.7, React 19.2.7, Fastify, Postgres+pgvector (dim 384), Redis, @xenova local embeddings.
- **Deploy:** single workspace Docker image; `docker-compose.prod.yml`; `scripts/deploy-haow.sh` (IAP SSH, GIT_SHA cache-bust). Dedicated stack at `/opt/haow-cms` on the GCP `haow` VM.
- **AI routing:** model catalog → provider (AnthropicProvider + generic OpenAICompatProvider for GPT/Grok/Gemini); embeddings always local (sovereign).

## 8. Non-functional

| Aspect | Current state |
|---|---|
| **Security** | httpOnly secure cookies, RBAC+ABAC, CSP + security headers, rate limiting, HMAC webhooks, audit log, admin-only sensitive fields |
| **Sovereignty** | Self-hosted; local embeddings; no mandatory data egress for retrieval. LLM calls go to chosen provider (configurable; Claude default) |
| **Availability** | 6 core containers, `restart: unless-stopped`; survives reboot |
| **TLS** | Let's Encrypt, auto-renew |
| **i18n** | Bilingual content (EN/AR + RTL); AI generation in Arabic; translation mode |
| **Observability** | Audit log, service logs, health endpoints |

## 9. Known gaps / constraints (see Matrix doc)

- Console **UI chrome is English** (content is bilingual; an Arabic/RTL admin interface is not yet built).
- **Public marketing site** (apps/web, EN/AR) is built but **not exposed** on the live URL (needs a subdomain vhost).
- **Image / deck** produce **concept previews** (no real image-render model wired; only video renders for real).
- **GPT & Gemini** keys are valid but their accounts need billing/quota (429).
- **Schema** is bootstrapped via first-boot dev-push; **production migrations** not yet generated.
- **Search** is Payload-backed; the OpenSearch/pgvector hybrid scale path (workers) is built but not deployed.
- **GCP firewall** is closed (project billing disabled); public access is via the shared host nginx vhost.

## 10. Success metrics (proposed)

- Time-to-first-on-brand-asset (target < 2 min).
- % content generated vs hand-authored.
- Arabic content share.
- Review→publish cycle time.
- Brand-guideline reuse (guidelines composed / adopted).
- Video renders completed.
