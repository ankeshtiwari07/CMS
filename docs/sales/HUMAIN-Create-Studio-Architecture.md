# HUMAIN Create Studio
## High-Level Architecture
### Agentic, Bilingual Content and Experience Platform

---

| | |
|---|---|
| **Document type** | High-Level Architecture |
| **Prepared for** | HUMAIN |
| **Region** | Kingdom of Saudi Arabia (KSA) — in-region |
| **Classification** | Confidential — Client Presentation |
| **Version** | 1.0 |
| **Date** | June 2026 |

---

## 1. Overview

HUMAIN Create Studio is an **agentic, AI-native content platform**. A team of specialised AI agents, coordinated by an orchestrator, turns natural-language intent into interactive, on-brand, bilingual outcomes — websites, content, brand guidelines, themes, images and video — all governed by role-based permissions, editorial gates and a complete audit trail, hosted in-Kingdom.

This document describes the system at a high level: context, components, the agentic core, data and integration architecture, request flow, deployment, and the non-functional posture.

---

## 2. System Context

```mermaid
flowchart TB
    subgraph People["HUMAIN Teams"]
        AU[Authors / Reviewers / Publishers]
        BR[Brand and Admin Teams]
    end
    AUD[Public Web Audience]
    AG[Approved AI Agents · MCP]

    SYS[[HUMAIN Create Studio<br/>Agentic Content Platform · in-Kingdom]]

    IDP[Enterprise Identity · OIDC]
    LLM[LLM Providers · Claude]
    RND[Render Services · Image/Video]
    OBJ[(Object Storage · in-region)]
    DOWN[Downstream Systems · CRM/DAM/Analytics]

    AU --> SYS
    BR --> SYS
    AG <--> SYS
    SYS --> AUD
    IDP <--> SYS
    SYS <--> LLM
    SYS <--> RND
    SYS <--> OBJ
    SYS --> DOWN
```

The platform is the system-of-record for content; identity, models, render and storage are integrated services.

---

## 3. High-Level Architecture

```mermaid
flowchart TB
    subgraph Users["People and Channels"]
        A[Authors · Reviewers · Publishers]
        B[Brand and Admin Teams]
        W[Public Web Audience]
    end
    subgraph Edge["Secure Edge · in-Kingdom"]
        N[Gateway · TLS · RBAC / ABAC]
    end
    subgraph Studio["Create Studio"]
        S[Conversational Studio<br/>chat · brand · design]
        WEB[Web Delivery<br/>Bilingual · RTL · Cached]
    end
    subgraph Agent["Agentic AI Core"]
        OR{{Orchestrator Agent}}
        SP[Specialist Agents]
        TL[Governed Tools<br/>search · retrieve · propose · build]
    end
    subgraph CMS["Structured CMS"]
        CO[Collections · Workflow<br/>Versions · Audit Log]
    end
    subgraph Data["Data and Intelligence · in-Kingdom"]
        DB[(Content Store + Vector Index)]
        SR[(Arabic-aware Search)]
        OBJ[(Media / Object Store)]
        Q[(Cache / Queue)]
    end
    subgraph Models["Model and Render"]
        LLM[LLM · Opus / Haiku]
        RND[Image / Video Render]
    end

    A --> N --> S --> OR
    B --> N
    W --> N --> WEB
    OR <--> SP
    OR --> TL
    OR --> LLM
    SP --> LLM
    TL --> CO
    TL --> DB
    TL --> RND
    CO --> DB
    CO --> OBJ
    WEB --> DB
    WEB --> SR
    TL -. every action audited .-> CO
```

---

## 4. Component View

| Component | Responsibility | Notes |
|---|---|---|
| **Edge / Gateway** | TLS termination, routing, auth, RBAC/ABAC | In-Kingdom; HTTPS only |
| **Create Studio (console)** | Conversational UI + Brand and Design surfaces | Streams agent output (SSE) |
| **Agentic AI Core (AI service)** | Orchestrator + specialists + governed tools | Tool-use loop on Claude |
| **Structured CMS** | Schema, RBAC/ABAC, editorial workflow, versions, audit | System-of-record |
| **Web Delivery** | Fast, cached, RTL-correct public rendering | Bilingual EN/AR |
| **Content Store** | Source of truth + vector embeddings | Postgres + pgvector |
| **Search** | Arabic-aware + semantic retrieval | — |
| **Object Store** | Media and rendered assets | S3-compatible, in-region |
| **Cache / Queue** | Performance + background jobs | Redis |
| **Model and Render** | LLM completion + image/video rendering | Provider-abstracted |

---

## 5. Agentic Core

The intelligence is an **orchestrator agent** running a multi-step tool-use loop. It plans, grounds itself in HUMAIN content and brand, delegates to specialist agents, and builds interactive outcomes — never a raw dump. Every tool call is audited; agents propose drafts, humans publish.

```mermaid
flowchart TB
    P[Person · intent] --> OR{{Orchestrator Agent}}
    OR -->|ground| RC[retrieve_context · RAG]
    OR -->|brand| BG[get_brand_guidelines]
    OR -->|delegate| SP[Specialist Agents<br/>draft · localize · brand · SEO · editorial · research]
    OR -->|build| BLD[build_site · build_content<br/>build_video · build_image<br/>build_brand · build_theme]
    RC --> DB[(Content + Vector Index)]
    BLD --> TOOLS[Governed Tools · scoped + audited]
    TOOLS --> CO[(CMS · drafts)]
    BLD --> RND[Render · image/video]
    OR --> HG{Human Approval Gate}
    HG -->|approved| PUB[Publish · bilingual]
    TOOLS -. logged .-> AL[(Audit Log)]
```

- **Orchestrator** runs on the strongest model (Opus) for reasoning/routing.
- **Specialists and generation** run on a fast model (Haiku) for cost efficiency.
- **Governed tools** are the only path to data — read (search/retrieve) and propose (drafts); never direct, unscoped writes.

---

## 6. Request Flow — "Build a website"

```mermaid
sequenceDiagram
    participant U as User
    participant S as Studio (SSE)
    participant O as Orchestrator (Opus)
    participant T as Governed Tools
    participant B as Build Agent
    participant D as Data / Brand
    U->>S: "Build a launch page for our summit"
    S->>O: prompt + history (stream)
    O->>T: get_brand_guidelines
    T->>D: read active brand
    D-->>O: brand tokens
    O->>B: build_site(brief, brand)
    B-->>O: site HTML
    O-->>S: artifact(html) + short intro (streamed)
    S-->>U: live preview + Open/Download + recommendations
    O->>D: audit log (agent run)
```

The same pattern serves every capability — only the build step differs (content, video, image, brand, theme).

---

## 7. Data Architecture

- **Content Store (Postgres):** the source of truth — collections, drafts, versions, workflow state, audit log.
- **Vector Index (pgvector):** sovereign, local embeddings (multilingual, 384-dim) power semantic, Arabic-aware retrieval (RAG) — no external embedding calls.
- **Search:** Arabic-aware + semantic retrieval over indexed content.
- **Object Store (S3-compatible, in-region):** media and rendered assets.
- **Cache / Queue (Redis):** performance and reliable background processing (indexing, render polling).

All content and embeddings remain **in-Kingdom**.

---

## 8. Integration Architecture

```mermaid
flowchart LR
    OIDC[Enterprise SSO · OIDC]
    AGENTS[Approved AI Agents · MCP tools]
    subgraph Platform["HUMAIN Create Studio · in-Kingdom"]
        CORE[[Agentic Core + Structured CMS]]
    end
    LLM[LLM Providers · Opus / Haiku]
    RND[Render Services · Image / Video]
    S3[(Object Storage · in-region)]
    WH[Signed Webhooks]
    DS[Downstream Systems]
    WEB[Public Web Channels · EN / AR]

    OIDC <-->|authn / SSO| CORE
    AGENTS <-->|scoped · audited| CORE
    CORE <-->|reason / generate| LLM
    CORE <-->|render assets| RND
    CORE <-->|sovereign storage| S3
    CORE -->|publish events| WH --> DS
    CORE -->|delivery| WEB
```

- **Provider-abstracted models** — HUMAIN is never locked to a single vendor.
- **MCP tool surface** — approved external agents act through the same governed, audited tools.
- **Signed webhooks** notify downstream systems on publish/content events.

---

## 9. Deployment Architecture

A self-contained, containerised stack, in-Kingdom, behind a TLS edge.

```mermaid
flowchart TB
    subgraph Edge["Edge"]
        NX[Nginx · TLS · routing]
    end
    subgraph Host["In-Kingdom Host / Cluster"]
        CON[Console · Studio]
        CMS[CMS · API]
        AIS[AI Service · Agents]
        PG[(Postgres + pgvector)]
        RD[(Redis)]
    end
    EXT[Model and Render Services]
    OS[(Object Storage · in-region)]

    NX --> CON
    NX --> CMS
    CON --> CMS
    CON --> AIS
    AIS --> PG
    AIS --> EXT
    CMS --> PG
    CMS --> OS
    AIS --> RD
```

- **Stateless app tier** (console, CMS, AI service) — horizontally scalable.
- **Managed data tier** (Postgres+pgvector, Redis) with health checks.
- **One image, many services** — each container runs a different workload from a shared build.
- **Repeatable deploys** with image cache-busting per release and forced container recreation.

---

## 10. Security, Governance and Sovereignty

- **In-Kingdom** hosting and processing — data residency under HUMAIN's control.
- **RBAC + ABAC** at every layer (role, site-scope, department, locale).
- **Editorial gating** — Draft → In Review → Approved; agents propose drafts, humans publish.
- **Immutable audit log** of all content *and* agent actions.
- **Secrets isolation** — credentials/keys separated from content and code.
- **Secure transport** — HTTPS/TLS everywhere; secure session cookies; CORS/CSRF protection.
- **Human-in-the-loop** — nothing reaches the public without approval.

---

## 11. Technology Stack

| Layer | Technology |
|---|---|
| Console / Web | Next.js (App Router), React, SSE streaming, EN/AR RTL |
| CMS | Payload (headless), RBAC/ABAC, versioned drafts, audit |
| AI service | Node/Fastify, Anthropic Claude (Opus + Haiku), tool-use loop |
| Agents / tools | Orchestrator + specialists; MCP governed tool surface |
| Embeddings | Local multilingual model (sovereign, 384-dim) |
| Data | Postgres + pgvector; Arabic-aware search; Redis |
| Render | Image/Video via provider-abstracted services |
| Storage | S3-compatible object storage, in-region |
| Edge / Infra | Nginx + TLS; containerised; one image, many services |

---

## 12. Scalability, Reliability and Observability

- **Scalability:** stateless app tier scales horizontally; queue-backed background work absorbs spikes; cost-tuned model routing (Opus for reasoning, Haiku for generation).
- **Reliability:** health-checked data tier; restart-on-failure services; graceful degradation (a missing model/render key surfaces a friendly message, never a crash).
- **Observability:** centralised logs/metrics; every agent run and content action recorded for full traceability.

---

## Appendix A — Payload CMS v3 Security Posture

The platform's content backend is **Payload CMS v3 (3.85.0)**. Payload v3 is a secure, production-grade, actively-maintained headless CMS (Figma-backed) on the Next.js App Router; security is a shared responsibility — Payload provides the primitives, and this deployment configures and hardens them.

### A.1 Built-in security controls (Payload v3)

| Control | Detail |
|---|---|
| **Authentication** | bcrypt-hashed passwords · JWT in **httpOnly** cookies · API keys · email verification · password reset · **account lockout** (`maxLoginAttempts` / `lockTime`) |
| **Authorization** | Collection- **and** field-level access-control functions → real **RBAC + ABAC** |
| **Injection defence** | Parameterised queries via **Drizzle ORM** (Postgres) |
| **Web security** | **CORS + CSRF** controls, configurable origins; inherits the **Next.js** security model |
| **Data integrity** | Versioned drafts, editorial workflow state, audit hooks |
| **Maintenance** | Actively maintained; pinned, recent **3.85.0** |

### A.2 Applied controls in this platform

| Area | Configuration |
|---|---|
| **Transport** | HTTPS/TLS · `COOKIE_SECURE=true` · secure session cookies |
| **Access control** | **RBAC (6 roles)** + **ABAC** (site, department, locale) at collection and field level |
| **Secrets** | `PAYLOAD_SECRET` and provider keys held in environment, **not committed** to source |
| **Governance** | Editorial gating (draft → review → publish) · **immutable audit log** |
| **Agentic safety** | Agents **propose drafts**; a human approves before publish |
| **Sovereignty** | Hosted **in-Kingdom**; secrets isolated from content and code |

### A.3 Hardening checklist

- Keep Payload **patched** and monitor its security advisories.
- Strong, rotated `PAYLOAD_SECRET`; restrict `/admin` exposure; MFA for maintainers.
- **Dependency / SCA scanning** (Dependabot / Snyk / `npm audit`) in CI.
- Replace the first-boot dev schema-push with **generated Payload migrations**.
- Edge **rate-limiting / WAF**; least-privilege database and registry credentials.

> No framework is free of vulnerabilities; the correct posture is to **stay current and monitor advisories**. Most real-world risk lies in weak secrets, over-permissive access rules, leaked environment variables or unpatched dependencies — all addressed above.

---

*Prepared for HUMAIN — Confidential. High-level architecture of the HUMAIN Create Studio platform.*
