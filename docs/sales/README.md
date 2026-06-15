# HUMAIN Create Studio — Customer Collateral

Branded, customer-facing documents for the HUMAIN Create Studio platform, plus the
build pipeline that generates them. All documents are HUMAIN + Aavya branded (cover
lockup, per-page header strip, confidential footer) with rendered Mermaid diagrams and
real product screenshots.

## Documents (PDF + Markdown source)

| Document | Contents |
|---|---|
| `HUMAIN-Create-Studio-PRD` | Product Requirements — agentic positioning, business impact, requirements, architecture & integration diagrams, and Appendix A product snapshots |
| `HUMAIN-Create-Studio-UIUX` | UI/UX & User Journeys — design system, navigation, and a step-by-step journey (with screenshots) for every capability |
| `HUMAIN-Create-Studio-Architecture` | High-Level Architecture — system context, agentic core, request-flow sequence, data, integration, deployment, security |
| `HUMAIN-Create-Studio-Deck` | Combined master deck — all three, one cover + part dividers |
| `HUMAIN-Create-Studio-Sprint-Release-Plan` | Sprint 1 plan + release sheet (29 tasks, R1–R9) — branded PDF |
| `HUMAIN-Create-Studio-Sprint-Tasks.csv` / `-Release-Plan.csv` | The task sheet and release sheet as spreadsheets (Jira/Excel import) |

## Build pipeline

Node + Puppeteer + `marked` + `pdf-lib`. Renders Markdown → branded A4 PDF.

```bash
npm install

# PRD (defaults)
node build.mjs

# UI/UX
SRC_MD=HUMAIN-Create-Studio-UIUX.md OUT_PDF=HUMAIN-Create-Studio-UIUX.pdf \
  DOC_TITLE="UI/UX and User Journeys" DOC_FOOT="UI/UX and User Journeys" node build.mjs

# Architecture
SRC_MD=HUMAIN-Create-Studio-Architecture.md OUT_PDF=HUMAIN-Create-Studio-Architecture.pdf \
  DOC_TITLE="High-Level Architecture" DOC_FOOT="Architecture" node build.mjs

# Combined deck (stitches the three sources, then renders)
node assemble-deck.mjs
SRC_MD=HUMAIN-Create-Studio-Deck.md OUT_PDF=HUMAIN-Create-Studio-Deck.pdf \
  DOC_TITLE="Master Deck" DOC_FOOT="Master Deck" node build.mjs
```

All paths are script-relative — run from this folder.

## Screenshots

`shots/` holds the product screenshots the docs embed. Re-capture from the live site with
the `capture*.mjs` scripts (Puppeteer drives the real Studio; the admin login uses the
`SEED_ADMIN_PASSWORD` env var):

```bash
SEED_ADMIN_PASSWORD=... node capture.mjs    # login, studio, chat, website, design, brand
SEED_ADMIN_PASSWORD=... node capture2.mjs   # tighter design/brand + content/video/projects
SEED_ADMIN_PASSWORD=... node capture3.mjs   # populated brand guideline
```

## Branding assets

`humain-wordmark.svg`, `aavya-logo.svg`, `humain-favicon.svg` — used in the cover lockup and
running header strip.
