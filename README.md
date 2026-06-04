# HUMAIN Payload CMS — Production Monorepo

AI-native experience platform. Two surfaces of one system:
**Create Studio** (light, prompt-first) + **CMS Admin** (dark, structured), sharing one
content store, brand token system, and AI backbone. Self-hosted, KSA region, no mocks.

## Stack (pinned)
- CMS: Payload v3 + PostgreSQL + pgvector
- Delivery: Next.js (App Router), ISR, EN+AR RTL
- Search: OpenSearch (Arabic analyzer)
- Cache/queues: Redis + BullMQ
- AI: Anthropic **Claude** (completion) + **Voyage** (embeddings), abstracted
- Agents: MCP server (scoped, audited tools)
- Auth: generic **OIDC**
- Storage: S3-compatible (KSA)
- Infra: Kubernetes + Terraform + Helm; CI/CD: GitHub Actions; OTel observability

## Quick start (local, real services)
```bash
cp .env.example .env           # fill ANTHROPIC_API_KEY, VOYAGE_API_KEY, OIDC_*
docker compose up -d           # postgres+pgvector, redis, opensearch, minio, otel
pnpm install
psql "$DATABASE_URI" -f scripts/migrate-audit.sql
pnpm --filter @humain/cms generate:types
pnpm db:seed                   # admin + bilingual published page
pnpm dev                       # cms :3001, web :3000, studio :3002, ai :4000
```

## Layout
- `apps/cms` — Payload (collections, blocks, RBAC, hooks, OIDC, S3)
- `apps/web` — Next.js delivery (ISR, RTL, revalidation webhook)
- `apps/studio` — Create Studio (prompt UI + /api/generate)
- `apps/ai-service` — Claude/Voyage provider, prompt library (Zod-validated), RAG worker, indexer
- `apps/mcp-server` — MCP tools: content_search / content_get / content_propose
- `packages/blocks` — 10 reusable block schemas
- `packages/ui` — CMS-agnostic block renderer
- `packages/design-tokens` — Studio + CMS themes, shared scale
- `infra/` — Terraform, Helm, Dockerfiles, OTel
- `.github/workflows` — CI (lint, types, test, e2e, Trivy, Semgrep) + tagged deploy

See `docs/BUILD_GUIDE` (the master .docx) for the full end-to-end build sequence.
