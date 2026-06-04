import Fastify from "fastify";
import { z } from "zod";
import { getProvider } from "./providers/index.js";
import { parseStructured } from "./providers/types.js";
import { prompts, type PromptId } from "./prompts/library.js";

const app = Fastify({ logger: true });
const provider = getProvider();

app.get("/health", async () => ({ ok: true, provider: provider.name }));

// Run a versioned prompt with schema validation (human-in-the-loop: returns suggestion only).
app.post("/run", async (req, reply) => {
  const body = z.object({
    promptId: z.string(),
    input: z.string(),
    fast: z.boolean().optional(),
  }).parse(req.body);

  const entry = prompts[body.promptId as PromptId];
  if (!entry) return reply.code(400).send({ error: "unknown promptId" });

  const raw = await provider.complete({
    system: entry.system,
    messages: [{ role: "user", content: body.input }],
    fast: body.fast,
    maxTokens: 1024,
  });

  try {
    const data = parseStructured(raw, entry.schema as z.ZodType);
    return { ok: true, data, model: provider.name };
  } catch (e) {
    // Reject invalid output — never persist unvalidated AI content.
    return reply.code(422).send({ ok: false, error: "validation_failed", detail: String(e) });
  }
});

// Embeddings endpoint used by the RAG worker.
app.post("/embed", async (req) => {
  const body = z.object({ texts: z.array(z.string()) }).parse(req.body);
  const vectors = await provider.embed(body.texts);
  return { ok: true, vectors, dim: vectors[0]?.length ?? 0 };
});

// Studio generation (streaming-ready; returns text artifact here for brevity).
app.post("/studio/generate", async (req, reply) => {
  const body = z.object({
    mode: z.enum(["deck","image","website","email","brand","designSystem","writing","translation"]),
    prompt: z.string(),
    options: z.record(z.unknown()).optional(),
  }).parse(req.body);
  const system = `You are HUMAIN Create Studio generating a ${body.mode}. Produce on-brand, production-ready output.`;
  const out = await provider.complete({ system, messages: [{ role: "user", content: body.prompt }], maxTokens: 2048 });
  return { ok: true, mode: body.mode, artifact: out };
});

const port = Number(process.env.PORT || 4000);
app.listen({ port, host: "0.0.0.0" }).then(() => app.log.info(`ai-service on ${port}`));
