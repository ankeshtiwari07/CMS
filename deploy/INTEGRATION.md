# CMS module ↔ HUMAIN Create — Integration & Production Delivery

Built against the HUMAIN Create Technical Document v1.0. The CMS module ("Aavya") plugs into
HUMAIN Create's architecture (Next.js → Kong → services; Celery/Redis async; custom model
gateway → Gemini/OpenAI/MiniMax-sovereign; Postgres + GCS; multi-tenant; Azure/Google SSO;
GCP KMS; GitLab CI dev/stage/prod; GKE target; KSA residency).

## 1. Integration interfaces (LIVE + validated on VM haow)

All service-to-service calls authenticate via `Authorization: Bearer <HUMAIN_INTEGRATION_TOKEN>`
or an HMAC-signed body (`x-humain-signature: sha256=…`). Tenant via `x-tenant-id`.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/humain/manifest` | GET | Discovery — capabilities, endpoints, auth, tenancy, residency, model routing |
| `/api/humain/generations` | POST/GET | Ingest a HUMAIN Create generation (deck/image/email/brand…) into the tenant library (Projects); list the tenant library |
| `/api/humain/brand-context` | GET/POST | Share the tenant's active brand context both ways (brand-ingestion interop) |
| `/api/humain/library` | GET | Expose the tenant's **published** CMS content back to HUMAIN Create's agents |
| `/api/humain/events` | POST | Inbound webhook receiver (HMAC-verified) — e.g. `generation.completed` → auto-ingest |
| `/api/auth/sso` | POST | Federated **OIDC SSO bridge** (Azure/Google) → CMS session cookie |

Outbound: signed `content.submitted / .approved / .published / generation.ingested` events to
`HUMAIN_EMIT_URL` (see `lib/webhooks.ts`; wired into `/api/publish`).

Model routing: `ai-service` gains a **`humain-gateway`** provider (id `humain-gateway`, sovereign
MiniMax default) so all model access can flow through HUMAIN's custom gateway — no direct
provider calls. Point `HUMAIN_GATEWAY_URL` at the gateway to activate.

### Validated (this delivery)
- manifest 200; unauth → 401; **generation ingest → libraryId, tenant-scoped**; tenant library
  listing; brand-context; inbound event valid-HMAC → 200, bad-HMAC → 401; gateway provider in catalog.

## 2. GKE + blue-green CI/CD (infra-as-code under `deploy/`)
- `deploy/k8s/` — namespace, ConfigMap, **ExternalSecrets (GCP Secret Manager + KMS)**, **blue-green**
  CMS Deployments (blue/green + live/preview Services + selector flip), ai-service + workers, HPA,
  PodDisruptionBudget, Ingress (**LB → Cloud Armor WAF → Kong → services**), ManagedCertificate.
- `deploy/kong/kong.yaml` — declarative gateway (routes + JWT, CORS, rate-limit, size-limit, ip-restriction).
- `deploy/ci/.gitlab-ci.yml` — GitLabOps: build → test → **dev → stage → prod** (manual prod gate).
- `deploy/scripts/blue-green.sh` — zero-downtime rollout: deploy idle color → smoke via preview Service
  → atomic selector flip → drain old (instant rollback if smoke fails).

Region parameterised to KSA landing zone (`me-central2`) per residency; VM demo stays in `asia-south1`.

## 3. Gap closure (vs the sprint plan)
- **OIDC/SSO** (task 28) — real Azure/Google bridge (RS256 JWKS via Node crypto, user provisioning, cookie).
- **Signed webhook emitter** (task 21) — `lib/webhooks.ts`, wired to publish.
- **QA** (tasks 51–58) — `tests/cms-workflow.test.ts` (RBAC/workflow/audit/integration, Vitest) +
  `tests/journeys.spec.ts` (Playwright E2E: sign-in, brand, CMS, RTL).
- **Multi-tenancy** — tenant carried on every integration write (`options.tenant`) + `x-tenant-id`;
  first-class `tenant` field on BaseContent is the remaining production hardening (Payload schema change).
- **Secrets** — ExternalSecrets/KMS manifest replaces env-file for production.

## Activation checklist (to go from demo → HUMAIN production)
1. Provision GKE clusters (dev/stage/prod) in the KSA landing zone; apply `deploy/k8s`.
2. Load secrets into GCP Secret Manager (KMS-backed); ExternalSecrets projects them.
3. Set `HUMAIN_GATEWAY_URL` to the model gateway; `HUMAIN_EMIT_URL` to HUMAIN's event sink.
4. Register the CMS JWT consumer + OIDC client (Azure/Google) with HUMAIN's IdP.
5. Point GitLab CI at the clusters; first `deploy-prod` is manual-gated blue-green.
