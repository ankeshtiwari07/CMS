// Local, sovereign embeddings via transformers.js — no external API key.
// Multilingual (EN+AR) MiniLM, 384-dim, mean-pooled + normalized.
let extractorPromise: Promise<any> | null = null;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline } = await import("@xenova/transformers");
      const model = process.env.EMBEDDING_MODEL || "Xenova/paraphrase-multilingual-MiniLM-L12-v2";
      return pipeline("feature-extraction", model);
    })();
  }
  return extractorPromise;
}

export const EMBED_DIM = Number(process.env.PGVECTOR_DIM || 384);

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const extractor = await getExtractor();
  const out: number[][] = [];
  for (const t of texts) {
    const res = await extractor(t || " ", { pooling: "mean", normalize: true });
    out.push(Array.from(res.data as Float32Array));
  }
  return out;
}
