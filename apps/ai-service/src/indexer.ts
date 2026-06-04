// OpenSearch indexer worker: syncs published content for lexical + faceted search.
import { Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null });
const OS = process.env.OPENSEARCH_URL || "http://localhost:9200";
const auth = "Basic " + Buffer.from(`${process.env.OPENSEARCH_USERNAME}:${process.env.OPENSEARCH_PASSWORD}`).toString("base64");

async function ensureIndex() {
  await fetch(`${OS}/content`, {
    method: "PUT", headers: { "content-type": "application/json", authorization: auth },
    body: JSON.stringify({
      mappings: { properties: {
        entity: { type: "keyword" }, locale: { type: "keyword" },
        title: { type: "text", analyzer: "standard",
          fields: { ar: { type: "text", analyzer: "arabic" } } },
        body: { type: "text", fields: { ar: { type: "text", analyzer: "arabic" } } },
      } },
    }),
  }).catch(() => {}); // ignore "already exists"
}

new Worker("index", async (job) => {
  await ensureIndex();
  const { collection, id } = job.data as { collection: string; id: string };
  if (job.name === "delete") {
    await fetch(`${OS}/content/_doc/${collection}:${id}`, { method: "DELETE", headers: { authorization: auth } });
    return;
  }
  const base = process.env.CMS_BASE_URL || "http://localhost:3001";
  for (const locale of (process.env.SUPPORTED_LOCALES || "en,ar").split(",")) {
    const res = await fetch(`${base}/api/${collection}/${id}?locale=${locale}`);
    if (!res.ok) continue;
    const doc = await res.json();
    await fetch(`${OS}/content/_doc/${collection}:${id}:${locale}`, {
      method: "PUT", headers: { "content-type": "application/json", authorization: auth },
      body: JSON.stringify({ entity: collection, locale, title: doc.title ?? doc.headline ?? doc.name, body: JSON.stringify(doc).slice(0, 8000) }),
    });
  }
}, { connection });

console.log("indexer started");
