// MCP server exposing scoped, audited tools over HUMAIN content (RAG + lexical).
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Pool } from "pg";
import { z } from "zod";

const pool = new Pool({ connectionString: process.env.DATABASE_URI });
const AI = process.env.AI_SERVICE_URL || "http://localhost:4000";

async function audit(tool: string, args: unknown, count: number) {
  // Matches the Payload AuditLog collection schema (apps/cms/collections/AuditLog.ts).
  await pool
    .query(
      `INSERT INTO audit_log(summary, action, collection_slug, document_id, "user", diff, created_at, updated_at)
       VALUES($1, 'update', 'mcp', '-', 'mcp-agent', $2, now(), now())`,
      [`mcp:${tool} (${count} result${count === 1 ? "" : "s"})`, JSON.stringify({ args, count })],
    )
    .catch(() => {});
}

async function embedQuery(text: string): Promise<number[]> {
  const r = await fetch(`${AI}/embed`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ texts: [text] }) });
  const d = await r.json() as { vectors: number[][] };
  return d.vectors[0];
}

const server = new McpServer({ name: "humain-content", version: "1.0.0" });

// READ: semantic search across published content.
server.tool("content_search",
  { query: z.string(), locale: z.string().default("en"), limit: z.number().default(5) },
  async ({ query, locale, limit }) => {
    const vec = await embedQuery(query);
    const { rows } = await pool.query(
      `SELECT entity, entity_id, content, 1 - (vector <=> $1) AS score
       FROM embeddings WHERE locale=$2
       ORDER BY vector <=> $1 LIMIT $3`,
      [JSON.stringify(vec), locale, limit]
    );
    await audit("content_search", { query, locale }, rows.length);
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  }
);

// READ: fetch one document by entity + id (via CMS API).
server.tool("content_get",
  { collection: z.string(), id: z.string(), locale: z.string().default("en") },
  async ({ collection, id, locale }) => {
    const base = process.env.CMS_BASE_URL || "http://localhost:3001";
    const res = await fetch(`${base}/api/${collection}/${id}?locale=${locale}`);
    const doc = await res.json();
    await audit("content_get", { collection, id }, 1);
    return { content: [{ type: "text", text: JSON.stringify(doc) }] };
  }
);

// WRITE (gated): propose a draft — never publishes. Lands for human review.
server.tool("content_propose",
  { collection: z.string(), draft: z.record(z.unknown()) },
  async ({ collection, draft }) => {
    const base = process.env.CMS_BASE_URL || "http://localhost:3001";
    const res = await fetch(`${base}/api/${collection}?draft=true`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.MCP_SERVICE_TOKEN}` },
      body: JSON.stringify({ ...draft, _status: "draft" }),
    });
    const out = await res.json();
    await audit("content_propose", { collection }, 1);
    return { content: [{ type: "text", text: JSON.stringify({ proposedDraftId: out?.doc?.id }) }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
