import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { z } from "zod";
import { getProvider, resolveModel, listModels } from "./providers/index.js";
import { parseStructured } from "./providers/types.js";
import { prompts, type PromptId } from "./prompts/library.js";
import { startRender, pollRender, videoConfigured } from "./providers/video.js";

const app = Fastify({ logger: true, bodyLimit: 1_000_000 });
const provider = getProvider();

await app.register(rateLimit, {
  max: Number(process.env.RATE_LIMIT_MAX || 60),
  timeWindow: process.env.RATE_LIMIT_WINDOW || "1 minute",
});

app.get("/health", async () => ({ ok: true, provider: provider.name, configured: provider.configured ?? false }));

// Catalog of selectable models + whether each is configured (has its API key).
app.get("/models", async () => ({ models: listModels(), videoConfigured }));

// ---- Video rendering (text-to-video) ----
// Start a render from a text prompt (usually the VIDEO_PROMPT from /studio/generate).
app.post("/video/render", async (req) => {
  const body = z.object({ prompt: z.string().min(1).max(2000) }).parse(req.body);
  return startRender(body.prompt);
});
// Poll a render job.
app.get("/video/status/:id", async (req) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  return pollRender(id);
});

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

const TEXT_MODES = [
  "website", "email", "writing", "translation", "brand", "designSystem",
  // Wave A additions:
  "event", "webinar", "campaign", "brandGuideline", "websiteBuild", "video",
  // Quick-action additions:
  "conference", "summit",
] as const;
const PREVIEW_MODES = ["image", "deck"] as const;

// Modes whose output is raw HTML rendered in a live in-app preview.
const HTML_MODES: readonly string[] = ["websiteBuild"];
// Modes that produce long structured documents — give them more tokens.
const LONG_MODES: readonly string[] = ["campaign", "brandGuideline", "websiteBuild", "video", "event", "webinar", "conference", "summit"];

const systemFor: Record<string, string> = {
  website: "You are HUMAIN Create Studio. Generate clean, production-ready landing-page copy and a section outline. On-brand and concise.",
  email: "You are HUMAIN Create Studio. Write a polished marketing email (subject + body). On-brand, concise.",
  writing: "You are HUMAIN Create Studio. Write well-structured long-form content with clear headings.",
  translation: "You are HUMAIN Create Studio. Translate faithfully between English and Arabic, preserving tone and meaning.",
  brand: "You are HUMAIN Create Studio. Propose a concise brand voice and messaging system.",
  designSystem: "You are HUMAIN Create Studio. Propose design tokens (color, type, spacing) as structured notes.",
  event: "You are HUMAIN Create Studio. Produce a complete EVENT package with clear markdown headings: Title & tagline; Overview; Audience; Agenda (with timings); Speakers; Logistics (date/venue/format); Registration CTA; and three short promo blurbs (LinkedIn, email subject+preview, X/Twitter). Concise, on-brand, action-oriented.",
  webinar: "You are HUMAIN Create Studio. Produce a complete WEBINAR package with markdown headings: Title & hook; Who it's for; Learning outcomes (3-5 bullets); Run-of-show (minute-by-minute agenda); Speaker bios; Registration page copy; Reminder email; and Follow-up email. Concise and compelling.",
  conference: "You are HUMAIN Create Studio. Produce a complete CONFERENCE package with markdown headings: Title & theme; Overview; Audience; Multi-track agenda (days, parallel tracks, session titles with times); Keynote & speaker lineup (with talk titles); Venue & logistics; Sponsorship tiers; Registration CTA; and three promo blurbs (LinkedIn, email subject+preview, X). On-brand and ambitious.",
  summit: "You are HUMAIN Create Studio. Produce an executive SUMMIT package with markdown headings: Title & theme; Strategic premise; Invited audience (C-level / ministerial); High-level agenda (half/full day); Keynote topics; Panel & roundtable themes; Featured speakers; By-invitation logistics; Registration/RSVP CTA; and promo blurbs. Prestigious, concise, on-brand.",
  campaign: "You are HUMAIN Create Studio. Produce an integrated marketing CAMPAIGN with markdown headings: Big idea; Objective & KPIs; Target audience & insight; Key messages & proof points; Channel plan (web, email, social, paid, PR); 4-week content calendar (as a table); Hero headline + 3 variations; and primary CTAs. Practical and on-brand.",
  brandGuideline: "You are HUMAIN Create Studio, an expert brand strategist. Produce a structured BRAND GUIDELINE with markdown headings: Brand Essence (one line); Positioning statement; Personality & values; Voice & tone (with do/don't); Messaging pillars (3-4); Color palette (list each with HEX and usage); Typography (headline + body recommendations); Logo usage (do & don't); Imagery & art direction; Iconography; and Example applications. Be specific and usable; include concrete hex codes and font names.",
  websiteBuild:
    "You are HUMAIN Create Studio, an expert front-end engineer. Build a COMPLETE, responsive, single-file landing page. " +
    "Return ONLY valid HTML starting with <!doctype html> and nothing else (no markdown fences, no commentary). " +
    "Use inline <style> with modern CSS (flex/grid, system font stack), on-brand for HUMAIN (primary teal #00A18B, dark ink #0B1416, lime accent #C2E54B, generous whitespace, rounded corners). " +
    "Include: a sticky header with logo text 'HUMAIN' and nav, a hero with headline+subhead+CTA, a 3-up features section, a stats or logos strip, a testimonial, a closing CTA band, and a footer. Use semantic HTML and real, specific copy based on the user's request.",
  video:
    "You are HUMAIN Create Studio, a creative director. Produce a production-ready VIDEO package with markdown headings: Logline (one sentence); Concept & tone; Target duration; Script (scene-by-scene — for each scene give Visual, Voiceover/Dialogue, On-screen text); Shot list; Storyboard notes (describe each key frame); Music & pacing; and a single line beginning 'VIDEO_PROMPT:' followed by one vivid paragraph (<500 chars) suitable for a generative text-to-video model. Make it shootable.",
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
      // Prior conversation turns for Claude-like multi-turn refinement.
      history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) })).max(12).optional(),
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

  const html = HTML_MODES.includes(body.mode);
  const long = LONG_MODES.includes(body.mode);
  const system = preview
    ? `You are HUMAIN Create Studio. The user wants to create a ${body.mode}. This build generates a detailed CONCEPT PREVIEW (layout, content, visual direction) — not a rendered ${body.mode}. Produce a structured brief.`
    : systemFor[body.mode] ?? systemFor.writing;

  // Prior turns (if any) give the model conversation context for refinements.
  const history = (body.history ?? []).map((m) => ({ role: m.role, content: m.content }));
  try {
    let out = await chosen.complete({
      system,
      messages: [...history, { role: "user", content: body.prompt }],
      maxTokens: preview ? 1500 : long ? 4096 : 2048,
      model,
      fast: body.fast ?? fast,
    });
    // For HTML builds, strip any stray markdown fences so the preview iframe is clean.
    if (html) out = out.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    // Video mode: extract the text-to-video prompt so the render pipeline can use it.
    let videoPrompt: string | undefined;
    if (body.mode === "video") {
      const m = out.match(/VIDEO_PROMPT:\s*([\s\S]+?)(?:\n\n|$)/i);
      videoPrompt = (m?.[1] || body.prompt).trim().slice(0, 500);
    }
    return {
      ok: true, mode: body.mode, model: entry.id, modelLabel: entry.label, preview,
      html, artifact: out,
      ...(body.mode === "video" ? { video: true, videoPrompt, renderPending: true } : {}),
    };
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
