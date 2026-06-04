// RAG/index worker: consumes BullMQ jobs, embeds content to pgvector, generates alt-text.
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { Pool } from "pg";
import { getProvider } from "./providers/index.js";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null });
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

async function fetchContent(entity: string, id: string): Promise<{ locale: string; text: string }[]> {
  // Pull published content via Payload REST (local API in production).
  const base = process.env.CMS_BASE_URL || "http://localhost:3001";
  const out: { locale: string; text: string }[] = [];
  for (const locale of (process.env.SUPPORTED_LOCALES || "en,ar").split(",")) {
    const res = await fetch(`${base}/api/${entity}/${id}?locale=${locale}&depth=0`);
    if (res.ok) {
      const doc = await res.json();
      out.push({ locale, text: JSON.stringify(doc).slice(0, 20000) });
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
}, { connection });

console.log("rag worker started");
