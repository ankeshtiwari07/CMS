// Governed tools the agents act through. Each is permission-scoped to read-only
// grounding (RAG over HUMAIN's own content + brand) and degrades gracefully so a
// missing DB / CMS never breaks a conversation.
import { Pool } from "pg";
import { embedTexts } from "../providers/embeddings.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URI });
const CMS = process.env.CMS_BASE_URL || "http://localhost:3001";

export type ToolOutput = { ok: boolean; text: string };

// RAG: semantic, Arabic-aware retrieval over indexed HUMAIN content (pgvector).
export async function retrieveContext(query: string, locale = "en", limit = 5): Promise<ToolOutput> {
  try {
    const [vec] = await embedTexts([query]);
    const { rows } = await pool.query(
      `SELECT entity, entity_id, content, 1 - (vector <=> $1) AS score
         FROM embeddings WHERE locale = $2
         ORDER BY vector <=> $1 LIMIT $3`,
      [JSON.stringify(vec), locale, limit],
    );
    if (!rows.length) {
      return { ok: true, text: "No indexed HUMAIN content matched this query. Proceed from the brief and brand guidance." };
    }
    const text = rows
      .map((r: any, i: number) => `[${i + 1}] ${r.entity} (relevance ${Number(r.score).toFixed(2)})\n${String(r.content).slice(0, 800)}`)
      .join("\n\n");
    return { ok: true, text };
  } catch (e: any) {
    return { ok: false, text: `retrieve_context unavailable (${e?.message || e}). Proceed without retrieval.` };
  }
}

// Fetch HUMAIN brand voice / messaging / visual tokens to keep output on-brand.
export async function getBrandGuidelines(): Promise<ToolOutput> {
  const fallback =
    "No brand guidelines record found. Apply HUMAIN defaults — voice: confident, clear, forward-looking; " +
    "colours: primary teal #00A18B, dark ink #0B1416, lime accent #C2E54B; generous whitespace, rounded corners.";
  try {
    // Prefer the brand the user marked active; otherwise fall back to any guideline.
    const activeRes = await fetch(`${CMS}/api/brandGuidelines?where[isActive][equals]=true&limit=1&depth=0`);
    const active = activeRes.ok ? ((await activeRes.json()) as any)?.docs ?? [] : [];
    if (active.length) return { ok: true, text: `ACTIVE BRAND (follow this):\n${JSON.stringify(active[0]).slice(0, 3500)}` };
    const res = await fetch(`${CMS}/api/brandGuidelines?limit=3&depth=0`);
    if (!res.ok) return { ok: false, text: fallback };
    const docs = ((await res.json()) as any)?.docs ?? [];
    if (!docs.length) return { ok: true, text: fallback };
    return { ok: true, text: JSON.stringify(docs).slice(0, 3000) };
  } catch {
    return { ok: false, text: fallback };
  }
}

// The CMS component library — LIVE building-block components the admin curated.
// The Build Agent reuses these (adapting their HTML) instead of inventing markup,
// so generated pages stay on-brand and consistent (component-based CMS).
export async function getComponents(): Promise<ToolOutput> {
  try {
    const res = await fetch(`${CMS}/api/components?where[status][equals]=live&limit=50&depth=0&sort=-updatedAt`);
    if (!res.ok) return { ok: false, text: "No component library available." };
    const docs = ((await res.json()) as any)?.docs ?? [];
    if (!docs.length) return { ok: true, text: "The component library is empty — build from scratch on-brand." };
    const list = docs.map((d: any) => ({
      name: d.name,
      key: d.key,
      type: d.type,
      category: d.category,
      description: d.description,
      html: String(d.html || "").slice(0, 1400),
    }));
    return { ok: true, text: JSON.stringify(list).slice(0, 9000) };
  } catch {
    return { ok: false, text: "Component library unavailable." };
  }
}

// Audit one agentic run (mirrors the AuditLog collection schema; best-effort).
export async function auditAgentRun(summary: string, diff: unknown): Promise<void> {
  await pool
    .query(
      `INSERT INTO audit_log(summary, action, collection_slug, document_id, "user", diff, created_at, updated_at)
       VALUES($1, 'update', 'agent', '-', 'agent-orchestrator', $2, now(), now())`,
      [summary, JSON.stringify(diff)],
    )
    .catch(() => {});
}
