import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const HERE = dirname(fileURLToPath(import.meta.url));

const D = `${HERE}/`;

// Each source = cover title block, ---, doc-control table, ---, body…
// Keep the body (everything after the 2nd ---), drop the trailing prepared-for line.
function body(f) {
  const parts = readFileSync(D + f, "utf8").split(/\n---\n/);
  return parts.slice(2).join("\n---\n")
    .replace(/\n*\*Prepared for[\s\S]*$/, "")   // drop trailing prepared-for line
    .replace(/\n*-{3,}\s*$/, "")                 // drop trailing horizontal rule
    .trim();
}

const prd = body("HUMAIN-Create-Studio-PRD.md");
const uiux = body("HUMAIN-Create-Studio-UIUX.md");
const arch = body("HUMAIN-Create-Studio-Architecture.md");

const deck = `# HUMAIN Create Studio
## Master Deck
### PRD · UI/UX · Architecture — Agentic, Bilingual Content and Experience Platform

---

| | |
|---|---|
| **Document type** | Master Deck — PRD · UI/UX · Architecture |
| **Prepared for** | HUMAIN |
| **Region** | Kingdom of Saudi Arabia (KSA) — in-region |
| **Classification** | Confidential — Client Presentation |
| **Version** | 1.0 |
| **Date** | June 2026 |

---

## Contents

- **Part I — Product Requirements** — vision, scope, requirements, business impact, the agentic platform, and product snapshots.
- **Part II — UI/UX & User Journeys** — design system, navigation, interaction patterns, and the journey for every capability.
- **Part III — High-Level Architecture** — system context, agentic core, data, integration, deployment and security.

# Part I — Product Requirements

${prd}

# Part II — UI/UX and User Journeys

${uiux}

# Part III — High-Level Architecture

${arch}

---

*Prepared for HUMAIN — Confidential. Master deck: Product Requirements, UI/UX & User Journeys, and High-Level Architecture for the HUMAIN Create Studio platform.*
`;

writeFileSync(D + "HUMAIN-Create-Studio-Deck.md", deck);
console.log("Deck.md written:", deck.length, "chars");
