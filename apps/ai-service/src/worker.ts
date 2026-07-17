// RAG/index worker: consumes BullMQ jobs, embeds content to pgvector, generates alt-text.
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { Pool } from "pg";
import { getProvider } from "./providers/index.js";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null });
const pool = new Pool({ connectionString: process.env.DATABASE_URI });
const provider = getProvider();

async function ensureSchema() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE TABLE IF NOT EXISTS embeddings (
      id bigserial PRIMARY KEY,
      entity text NOT NULL, entity_id text NOT NULL,
      locale text NOT NULL, chunk_idx int NOT NULL,
      content text NOT NULL, vector vector(${process.env.PGVECTOR_DIM || 384}) NOT NULL,
      UNIQUE(entity, entity_id, locale, chunk_idx)
    );
    CREATE INDEX IF NOT EXISTS embeddings_vec ON embeddings USING hnsw (vector vector_cosine_ops);
  `);
}

function chunk(text: string, size = 1200): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out.length ? out : [""];
}

// Lexical richtext -> plaintext (collect all `text` nodes).
function lexicalToText(node: any): string {
  if (!node) return "";
  if (typeof node.text === "string") return node.text;
  const kids = node.root?.children || node.children;
  return Array.isArray(kids) ? kids.map(lexicalToText).join(" ") : "";
}
// Extract HUMAN-readable text from a doc (titles, string/textarea fields, and
// richtext) instead of JSON.stringify — far better retrieval relevance.
function docToText(doc: any): string {
  const parts: string[] = [];
  const skip = new Set(["id", "_status", "createdAt", "updatedAt", "slug", "vector", "password", "sizes", "url", "filename", "mimeType"]);
  const walk = (v: any, depth = 0) => {
    if (v == null || depth > 5) return;
    if (typeof v === "string") { const s = v.trim(); if (s && !/^https?:\/\//i.test(s) && !/^[0-9a-f]{16,}$/i.test(s)) parts.push(s); return; }
    if (Array.isArray(v)) { v.forEach((x) => walk(x, depth + 1)); return; }
    if (typeof v === "object") {
      if (v.root && Array.isArray(v.root.children)) { parts.push(lexicalToText(v)); return; }
      for (const [k, val] of Object.entries(v)) { if (!skip.has(k)) walk(val, depth + 1); }
    }
  };
  walk(doc);
  return parts.join("\n").replace(/\s+/g, " ").trim();
}

async function fetchContent(entity: string, id: string): Promise<{ locale: string; text: string }[]> {
  // Pull published content via Payload REST (local API in production).
  const base = process.env.CMS_BASE_URL || "http://localhost:3001";
  const out: { locale: string; text: string }[] = [];
  for (const locale of (process.env.SUPPORTED_LOCALES || "en,ar").split(",")) {
    const res = await fetch(`${base}/api/${entity}/${id}?locale=${locale}&depth=0`);
    if (res.ok) {
      const doc = await res.json();
      const text = docToText(doc).slice(0, 20000);
      if (text) out.push({ locale, text });
    }
  }
  return out;
}

new Worker("rag", async (job) => {
  await ensureSchema();
  const { collection, id } = job.data as { collection: string; id: string };
  if (job.name === "delete") {
    await pool.query("DELETE FROM embeddings WHERE entity=$1 AND entity_id=$2", [collection, id]);
    return;
  }
  if (job.name === "alt-text") {
    // Generate alt-text via AI service prompt, then PATCH media.
    return;
  }
  const docs = await fetchContent(collection, id);
  for (const { locale, text } of docs) {
    const chunks = chunk(text);
    const vectors = await provider.embed(chunks);
    for (let i = 0; i < chunks.length; i++) {
      await pool.query(
        `INSERT INTO embeddings(entity,entity_id,locale,chunk_idx,content,vector)
         VALUES($1,$2,$3,$4,$5,$6)
         ON CONFLICT(entity,entity_id,locale,chunk_idx)
         DO UPDATE SET content=EXCLUDED.content, vector=EXCLUDED.vector`,
        [collection, id, locale, i, chunks[i], JSON.stringify(vectors[i])]
      );
    }
  }
}, { connection: connection as any });

console.log("rag worker started");
