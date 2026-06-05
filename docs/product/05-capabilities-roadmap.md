# HUMAIN Platform — Capabilities Roadmap

**As of:** 2026-06-05

A **capability** is a durable organizational/product ability (broader than a single feature). This roadmap tracks each capability's **maturity** today and the target maturity by horizon.

### Maturity scale
| Level | Meaning |
|---|---|
| **L0** | Absent |
| **L1** | Basic / prototype |
| **L2** | Functional (live, real data) |
| **L3** | Mature (controls, scale, resilience) |
| **L4** | Differentiated / best-in-class |

---

## Capability maturity matrix

| # | Capability | Now (Q2'26) | Next (Q3'26) | Later (Q4'26→Q1'27) |
|---|---|:--:|:--:|:--:|
| C1 | **On-brand AI generation** | L2 | L3 | L4 |
| C2 | **Multi-model intelligence** (route across Claude/GPT/Grok/Gemini) | L2 | L3 | L4 |
| C3 | **Sovereign AI** (local embeddings, self-host, no mandatory egress) | L2 | L3 | L3 |
| C4 | **Arabic-first** (content) | L3 | L3 | L4 |
| C5 | **Arabic-first** (interface/UX) | L1 | L2 | L3 |
| C6 | **Rich creative — web** (live HTML builds) | L2 | L3 | L3 |
| C7 | **Rich creative — brand systems** (Brand Studio) | L2 | L3 | L4 |
| C8 | **Rich creative — video** (real render) | L2 | L3 | L3 |
| C9 | **Rich creative — image** | L1 | L2 | L3 |
| C10 | **Content lifecycle & workflow** | L2 | L3 | L3 |
| C11 | **Governance** (RBAC/ABAC, audit) | L2 | L3 | L3 |
| C12 | **Identity & SSO** | L1 | L1 | L3 |
| C13 | **Search & retrieval** | L1 | L2 | L3 |
| C14 | **Conversational UX** (multi-turn) | L2 | L3 | L3 |
| C15 | **Notifications & activity** | L2 | L3 | L3 |
| C16 | **Deployment & sovereignty ops** | L2 | L3 | L3 |
| C17 | **Observability / DR / SLOs** | L1 | L1 | L3 |
| C18 | **Public distribution** (live site, EN/AR) | L1 | L2 | L3 |
| C19 | **Multi-tenant / multi-site** | L0 | L0 | L2 |
| C20 | **AI safety & evaluation** (eval/promotion, brand grading) | L1 | L1 | L3 |

---

## Capability narratives & what raises the level

**C1 On-brand generation (L2→L3→L4):** Today brand context is available (Brand Studio) and generation is real. *Next:* feed brand guideline into generation by default. *Later:* auto-grade output against the brand and self-correct (C20 linkage).

**C2 Multi-model (L2→L3):** Catalog + per-task routing live. *Next:* fund all providers, add fallback/retry. *Later:* policy-based routing (cost/quality/sovereignty), eval-driven model promotion.

**C3 Sovereign AI (L2→L3):** Self-hosted + local embeddings today. *Next/Later:* fully on-Kingdom inference option (local/owned LLM endpoint) to remove provider egress entirely.

**C4/C5 Arabic-first:** Content is L3 (bilingual + RTL + generation + translation). Interface is L1 (English chrome). *Next:* ship the Arabic/RTL console UI → C5 to L2/L3.

**C6–C9 Rich creative:** Web builds (L2) and brand systems (L2) and video render (L2) are live; image is concept-only (L1). *Next:* real image; video controls/queue; *Later:* deck render, asset editing.

**C8 Video (L2→L3):** Real MP4 rendering live. To reach L3: queue/retry for single-concurrency, quality/duration controls, cost surfacing, and a fully sovereign render option.

**C12 Identity (L1→L3):** Local auth + RBAC/ABAC today; OIDC seam exists. *Later:* SSO + SCIM raises to L3.

**C13 Search (L1→L3):** Payload-backed search today. The OpenSearch + pgvector hybrid (workers) is built; deploying it raises to L3.

**C17 Observability (L1→L3):** Audit log + health today. *Later:* metrics/tracing, backups/DR, SLOs, autoscaling.

**C19 Multi-tenant (L0→L2):** Single-tenant today. *Later:* tenant isolation + content scheduling.

---

## Capability dependencies (sequencing)

```
C3 Sovereign ──┐
C2 Multi-model ┼─> C1 On-brand ──> C20 AI eval/brand grading
C7 Brand ──────┘
C4 Content i18n ──> C5 UI i18n ──> C18 Public site (EN/AR)
C11 Governance ──> C12 SSO/SCIM
C13 Search ──> (scale workers) ──> C17 Observability
```

**Priority order (value × readiness):** C5 (Arabic UI) · C18 (public site) · C9 (image) · C16/migrations · then C12, C13, C17, C19.
