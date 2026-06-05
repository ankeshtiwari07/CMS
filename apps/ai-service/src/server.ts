import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { z } from "zod";
import { getProvider, resolveModel, listModels } from "./providers/index.js";
import { parseStructured } from "./providers/types.js";
import { prompts, type PromptId } from "./prompts/library.js";

const app = Fastify({ logger: true, bodyLimit: 1_000_000 });
const provider = getProvider();

await app.register(rateLimit, {
  max: Number(process.env.RATE_LIMIT_MAX || 60),
  timeWindow: process.env.RATE_LIMIT_WINDOW || "1 minute",
});

app.get("/health", async () => ({ ok: true, provider: provider.name, configured: provider.configured ?? false }));

// Catalog of selectable models + whether each is configured (has its API key).
app.get("/models", async () => ({ models: listModels() }));

// Run a versioned prompt with schema validation (human-in-the-loop: suggestion only).
app.post("/run", async (req, reply) => {
  const body = z
    .object({ promptId: z.string(), input: z.string().max(20000), fast: z.boolean().optional() })
    .parse(req.body);
  const entry = prompts[body.promptId as PromptId];
  if (!entry) return reply.code(400).send({ error: "unknown promptId" });
  if (provider.configured === false) return reply.code(503).send({ error: "llm_not_configured" });

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
    return reply.code(422).send({ ok: false, error: "validation_failed", detail: String(e) });
  }
});

// Embeddings endpoint used by the RAG worker / search.
app.post("/embed", async (req) => {
  const body = z.object({ texts: z.array(z.string()).max(64) }).parse(req.body);
  const vectors = await provider.embed(body.texts);
  return { ok: true, vectors, dim: vectors[0]?.length ?? 0 };
});

const TEXT_MODES = ["website", "email", "writing", "translation", "brand", "designSystem"] as const;
const PREVIEW_MODES = ["image", "deck"] as const;

const systemFor: Record<string, string> = {
  website: "You are HUMAIN Create Studio. Generate clean, production-ready landing-page copy and a section outline. On-brand and concise.",
  email: "You are HUMAIN Create Studio. Write a polished marketing email (subject + body). On-brand, concise.",
  writing: "You are HUMAIN Create Studio. Write well-structured long-form content with clear headings.",
  translation: "You are HUMAIN Create Studio. Translate faithfully between English and Arabic, preserving tone and meaning.",
  brand: "You are HUMAIN Create Studio. Propose a concise brand voice and messaging system.",
  designSystem: "You are HUMAIN Create Studio. Propose design tokens (color, type, spacing) as structured notes.",
};

// Studio generation. Text modes -> Claude. Image/deck -> concept preview (Claude-only build).
app.post("/studio/generate", async (req) => {
  const body = z
    .object({
      mode: z.enum([...TEXT_MODES, ...PREVIEW_MODES] as [string, ...string[]]),
      prompt: z.string().min(1).max(8000),
      options: z.record(z.unknown()).optional(),
      fast: z.boolean().optional(),
      model: z.string().optional(), // model id from the catalog (/models)
    })
    .parse(req.body);

  const preview = (PREVIEW_MODES as readonly string[]).includes(body.mode);
  // Route to the chosen model's provider (defaults to Claude Opus).
  const { provider: chosen, model, fast, entry } = resolveModel(body.model);

  if (chosen.configured === false) {
    return {
      ok: true,
      mode: body.mode,
      model: entry.id,
      modelLabel: entry.label,
      preview,
      artifact:
        `⚙️ ${entry.label} is not configured yet. Add the ${entry.provider.toUpperCase()} API key on the ai-service ` +
        `to enable it, or pick another model. (Requested: ${body.mode} — “${body.prompt.slice(0, 80)}”.)`,
    };
  }

  const system = preview
    ? `You are HUMAIN Create Studio. The user wants to create a ${body.mode}. This build generates a detailed CONCEPT PREVIEW (layout, content, visual direction) — not a rendered ${body.mode}. Produce a structured brief.`
    : systemFor[body.mode] ?? systemFor.writing;

  try {
    const out = await chosen.complete({
      system,
      messages: [{ role: "user", content: body.prompt }],
      maxTokens: preview ? 1500 : 2048,
      model,
      fast: body.fast ?? fast,
    });
    return { ok: true, mode: body.mode, model: entry.id, modelLabel: entry.label, preview, artifact: out };
  } catch (e: any) {
    // Surface provider errors (e.g. billing/credit, rate limit) as a readable
    // artifact rather than a generic failure, so the Studio UI can show it.
    const msg = e?.error?.error?.message || e?.message || "Generation failed.";
    req.log.warn({ err: msg, model: entry.id }, "studio/generate provider error");
    return { ok: true, mode: body.mode, model: entry.id, modelLabel: entry.label, preview, artifact: `⚠️ ${msg}` };
  }
});

const port = Number(process.env.PORT || 4000);
app
  .listen({ port, host: "0.0.0.0" })
  .then(() => app.log.info(`ai-service on ${port} (provider=${provider.name}, configured=${provider.configured})`));
