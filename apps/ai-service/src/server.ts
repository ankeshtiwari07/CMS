import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { z } from "zod";
import { getProvider, resolveModel, listModels, providerByName, completeWithFallback, MODELS } from "./providers/index.js";
import { parseStructured } from "./providers/types.js";
import { prompts, type PromptId } from "./prompts/library.js";
import { startRender, pollRender, videoConfigured } from "./providers/video.js";
import { startImageRender, pollImageRender, imageConfigured } from "./providers/image.js";
import { runSlaSweep, getBreaches, startSlaScheduler } from "./sla.js";
import { runOrchestrator } from "./agents/orchestrator.js";
import { THEMES, generateDeckQuestions, generateOutline, generateDeck, regenerateSlide, translateDeck } from "./deck.js";
import { planWebsite, generateWebsite, generateSection, assemble } from "./website.js";

const app = Fastify({ logger: true, bodyLimit: 1_000_000 });
const provider = getProvider();

// Is ANY model provider usable? Generation must degrade to a configured provider
// (grok/minimax/…) rather than dead-ending just because the DEFAULT model's key
// is absent. Used to guard the "not configured" messages below.
function anyProviderConfigured(): boolean {
  return MODELS.some((m) => providerByName(m.provider).configured);
}
// First configured (non-hidden) model — the target we degrade to when the
// selected model's provider has no key.
function firstConfiguredModel() {
  return MODELS.find((m) => !m.hidden && providerByName(m.provider).configured);
}

await app.register(rateLimit, {
  max: Number(process.env.RATE_LIMIT_MAX || 60),
  timeWindow: process.env.RATE_LIMIT_WINDOW || "1 minute",
});

app.get("/health", async () => ({ ok: true, provider: provider.name, configured: provider.configured ?? false }));

// Catalog of selectable models + whether each is configured (has its API key).
app.get("/models", async () => ({ models: listModels(), videoConfigured, imageConfigured }));

// HITL proactive SLA reminders — current breach list (refreshed by the scheduler).
app.get("/sla/reminders", async () => getBreaches());
// Run a sweep on demand (used by ops / tests).
app.post("/sla/sweep", async (req) => {
  const b = await runSlaSweep((o, m) => req.log.info(o, m));
  return { ok: true, count: b.length, ...getBreaches() };
});

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

// ---- Image rendering (text-to-image, Replicate) ----
app.post("/image/render", async (req) => {
  const body = z.object({ prompt: z.string().min(1).max(2000), ratio: z.string().optional() }).parse(req.body);
  return startImageRender(body.prompt, body.ratio);
});
app.get("/image/status/:id", async (req) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  return pollImageRender(id);
});

// Run a versioned prompt with schema validation (human-in-the-loop: suggestion only).
app.post("/run", async (req, reply) => {
  const body = z
    .object({ promptId: z.string(), input: z.string().max(20000), fast: z.boolean().optional() })
    .parse(req.body);
  const entry = prompts[body.promptId as PromptId];
  if (!entry) return reply.code(400).send({ error: "unknown promptId" });
  if (provider.configured === false) return reply.code(503).send({ error: "llm_not_configured" });

  let raw: string;
  let usedProvider = provider.name;
  try {
    const fb = await completeWithFallback(
      { system: entry.system, messages: [{ role: "user", content: body.input }], fast: body.fast, maxTokens: 1024 },
      { primary: process.env.LLM_PROVIDER || "anthropic" },
    );
    raw = fb.text;
    usedProvider = fb.provider;
    if (fb.fellBack) req.log.warn({ tried: fb.tried, used: fb.provider, promptId: body.promptId }, "run fell back to another provider");
  } catch (e: any) {
    // All providers exhausted → clean JSON, never let the raw upstream error
    // propagate (it leaks headers + breaks the HTTP response).
    const msg = e?.error?.error?.message || e?.message || "generation failed";
    req.log.warn({ err: msg, promptId: body.promptId }, "run provider error (all fallbacks failed)");
    return reply.code(503).send({ ok: false, error: "llm_unavailable", detail: msg });
  }
  try {
    const data = parseStructured(raw, entry.schema as z.ZodType);
    return { ok: true, data, model: usedProvider };
  } catch (e) {
    return reply.code(422).send({ ok: false, error: "validation_failed", detail: String(e) });
  }
});

// Agentic content prefill: the drafting agent proposes a publish-ready first
// draft for EACH field of a chosen content type/template (on-brand, locale-aware).
// Human-in-the-loop: this is a SUGGESTION the author reviews and edits.
app.post("/content/suggest", async (req, reply) => {
  const body = z
    .object({
      typeLabel: z.string().max(120),
      template: z.string().max(120).optional(),
      locale: z.string().max(8).optional(),
      brief: z.string().max(2000).optional(),
      brand: z.string().max(4000).optional(),
      fields: z.array(z.object({ name: z.string(), label: z.string(), type: z.string().optional() })).max(40),
    })
    .parse(req.body);
  if (provider.configured === false) return reply.code(503).send({ error: "llm_not_configured" });
  const LANGS: Record<string, string> = {
    en: "clear, professional English",
    ar: "fluent Modern Standard Arabic",
    "ar-SA": "Saudi (Gulf) Arabic dialect",
    "ar-EG": "Egyptian Arabic dialect",
    "ar-AE": "Emirati (Gulf) Arabic dialect",
    "ar-MA": "Moroccan Arabic dialect (Darija)",
    "ar-LB": "Levantine Arabic dialect",
    fr: "natural, professional French",
    de: "natural, professional German",
    es: "natural, professional Spanish",
    pl: "natural, professional Polish",
  };
  const langInstruction = `Write ALL values in ${LANGS[body.locale || "en"] || "clear, professional English"}. `;
  const spec = body.fields.map((f) => `- ${f.name} (${f.label}${f.type ? `, ${f.type}` : ""})`).join("\n");
  const system =
    `You are HUMAIN Create Studio's content drafting agent. Propose a publish-ready FIRST DRAFT for a ` +
    `"${body.typeLabel}"${body.template ? ` using the "${body.template}" template` : ""}. ` +
    `Return ONLY a JSON object mapping each field's name to a suggested value. ` +
    `Short fields (title/headline/name/slug) = concise; textarea/richtext = 2–4 real, specific sentences of on-brand content; ` +
    `tags/keywords = comma-separated. ` +
    langInstruction +
    "No commentary, no code fences — JSON object only." +
    (body.brand ? ` Brand context to stay on-brand with:\n${body.brand}` : "");
  const user = `${body.brief ? `Brief: ${body.brief}\n\n` : ""}Fields to draft:\n${spec}\n\nReturn a JSON object keyed by field name.`;
  try {
    const fb = await completeWithFallback(
      { system, messages: [{ role: "user", content: user }], fast: true, maxTokens: 1600 },
      { primary: process.env.LLM_PROVIDER || "anthropic" },
    );
    const raw = fb.text;
    if (fb.fellBack) req.log.warn({ used: fb.provider }, "content/suggest fell back");
    let data: Record<string, string> = {};
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      const parsed = JSON.parse(m[0]);
      // keep only known fields, coerce to strings
      for (const f of body.fields) if (parsed[f.name] != null) data[f.name] = String(parsed[f.name]);
    }
    return { ok: true, data, model: provider.name };
  } catch (e) {
    return reply.code(502).send({ ok: false, error: "suggest_failed", detail: String(e) });
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

  // Only refuse when NO provider at all is usable. If the SELECTED model is
  // unconfigured but others are, we fall through — completeWithFallback (below)
  // filters to configured providers and answers on one of them.
  if (chosen.configured === false && !anyProviderConfigured()) {
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
    const fb = await completeWithFallback(
      {
        system,
        messages: [...history, { role: "user", content: body.prompt }],
        maxTokens: preview ? 1500 : long ? 4096 : 2048,
        model,
        fast: body.fast ?? fast,
      },
      { primary: entry.provider },
    );
    let out = fb.text;
    // If we fell back, reflect the provider that actually answered in the label.
    const used = fb.fellBack ? MODELS.find((m) => m.provider === fb.provider) ?? entry : entry;
    const usedId = used.id;
    const usedLabel = fb.fellBack ? `${used.label} (fallback)` : used.label;
    if (fb.fellBack) req.log.warn({ tried: fb.tried, used: fb.provider, mode: body.mode }, "studio/generate fell back");
    // For HTML builds, strip any stray markdown fences so the preview iframe is clean.
    if (html) out = out.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    // Video mode: extract the text-to-video prompt so the render pipeline can use it.
    let videoPrompt: string | undefined;
    if (body.mode === "video") {
      const m = out.match(/VIDEO_PROMPT:\s*([\s\S]+?)(?:\n\n|$)/i);
      videoPrompt = (m?.[1] || body.prompt).trim().slice(0, 500);
    }
    return {
      ok: true, mode: body.mode, model: usedId, modelLabel: usedLabel, preview,
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

// Conversational, streaming, agentic chat. Same inputs as /studio/generate, but
// the Orchestrator agent converses (asks one clarifying question when the request
// is ambiguous), grounds itself via governed tools, delegates to specialists, and
// streams the reply token-by-token (Server-Sent Events). Text modes use this; the
// rich artifact modes (websiteBuild/video/image/deck) keep /studio/generate.
app.post("/studio/chat", async (req, reply) => {
  const body = z
    .object({
      mode: z.string().default("auto"),
      prompt: z.string().min(1).max(8000),
      model: z.string().optional(),
      options: z.record(z.unknown()).optional(),
      history: z
        .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) }))
        .max(16)
        .optional(),
    })
    .parse(req.body);

  reply.hijack();
  reply.raw.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no",
  });
  const send = (e: unknown) => reply.raw.write(`data: ${JSON.stringify(e)}\n\n`);

  let { entry, model } = resolveModel(body.model);
  // If the selected model's provider has no key, transparently switch to the
  // first configured model so chat still works (instead of dead-ending).
  if (providerByName(entry.provider).configured === false) {
    const alt = firstConfiguredModel();
    if (!alt) {
      send({ type: "delta", text: `⚙️ No AI model is configured. Add a provider API key on the ai-service.` });
      send({ type: "done", model: entry.id, modelLabel: entry.label, artifact: "" });
      return reply.raw.end();
    }
    send({ type: "status", label: `Using ${alt.label}` });
    entry = alt; model = alt.model;
  }
  // The agent tool-use loop now runs on the SELECTED provider — Claude via the
  // Anthropic loop, or any tool-capable OpenAI-compatible model (MiniMax, HUMAIN
  // sovereign gateway, GPT, Grok, Gemini) via the compat loop. On failure it
  // still degrades to a single-shot fallback below.

  const deliverableSpec =
    body.mode === "auto" || body.mode === "writing"
      ? "You are a general creative & content assistant. Help with whatever the user asks — answer, brainstorm, or produce the requested content, formatted appropriately in clean markdown."
      : systemFor[body.mode] ?? systemFor.writing;

  const history = (body.history ?? []).map((m) => ({ role: m.role, content: m.content }));
  let collected = "";
  let streamed = false;
  try {
    await runOrchestrator({
      deliverableSpec,
      conversational: true,
      messages: [...history, { role: "user", content: body.prompt }],
      model,
      providerName: entry.provider,
      maxTokens: LONG_MODES.includes(body.mode) ? 4096 : 2048,
      onText: (d) => { collected += d; streamed = true; send({ type: "delta", text: d }); },
      onEvent: (e) => { if (e.type === "reset") collected = ""; if (e.type === "artifact") streamed = true; send(e); },
    });
    send({ type: "done", model: entry.id, modelLabel: entry.label, artifact: collected });
  } catch (e: any) {
    const msg = e?.error?.error?.message || e?.message || "Generation failed.";
    const availability =
      /credit|balance|quota|rate.?limit|429|overload|insufficient|unavailable|timeout|econn|enotfound|fetch failed|throttl|capacity|\b5\d\d\b|529/i.test(msg);
    // If the agentic loop (Claude) is unavailable and nothing has streamed yet,
    // degrade to a single-shot generation on a fallback provider so the chat
    // still produces a useful reply instead of an error. (Tool-use / specialist
    // delegation isn't available in this degraded path — it's an outage cushion.)
    if (!streamed && availability) {
      req.log.warn({ err: msg }, "studio/chat orchestrator unavailable — degrading to fallback provider");
      try {
        const fb = await completeWithFallback(
          {
            system: deliverableSpec + " Respond directly and helpfully in clean markdown.",
            messages: [...history, { role: "user", content: body.prompt }],
            maxTokens: LONG_MODES.includes(body.mode) ? 4096 : 2048,
          },
          { exclude: ["anthropic"] },
        );
        send({ type: "status", label: `Fallback model: ${fb.provider}` });
        const text = fb.text;
        for (let i = 0; i < text.length; i += 90) send({ type: "delta", text: text.slice(i, i + 90) });
        send({ type: "done", model: fb.provider, modelLabel: `${fb.provider} (fallback)`, artifact: text });
      } catch (e2: any) {
        const m2 = e2?.error?.error?.message || e2?.message || msg;
        req.log.warn({ err: m2 }, "studio/chat fallback also failed");
        send({ type: "error", message: m2 });
      }
    } else {
      req.log.warn({ err: msg, model: entry.id }, "studio/chat agent error");
      send({ type: "error", message: msg });
    }
  }
  reply.raw.end();
});

// ---- Deck Studio (gamma-style presentations) ------------------------------
// Themes (design systems) the deck can render with.
app.get("/deck/themes", async () => ({ themes: THEMES }));

// Clarifying questions the agent asks before drafting the outline.
app.post("/studio/deck/questions", async (req, reply) => {
  const body = z.object({ prompt: z.string().min(1).max(8000), model: z.string().optional() }).parse(req.body);
  const { entry } = resolveModel(body.model);
  try {
    const q = await generateDeckQuestions(body.prompt, entry.provider);
    return { ok: true, questions: q.questions, provider: q._provider };
  } catch (e: any) {
    req.log.warn({ err: e?.message }, "deck/questions error");
    return reply.code(502).send({ error: e?.message || "questions_failed" });
  }
});

// Plan a deck: prompt -> title + slide outline.
app.post("/studio/deck/outline", async (req, reply) => {
  const body = z.object({ prompt: z.string().min(1).max(8000), model: z.string().optional() }).parse(req.body);
  const { entry } = resolveModel(body.model);
  try {
    const o = await generateOutline(body.prompt, undefined, entry.provider);
    return { ok: true, title: o.title, subtitle: o.subtitle, slides: o.slides, provider: o._provider };
  } catch (e: any) {
    req.log.warn({ err: e?.message }, "deck/outline error");
    return reply.code(502).send({ error: e?.message || "outline_failed" });
  }
});

// Generate the full deck (optionally from an approved outline).
app.post("/studio/deck", async (req, reply) => {
  const body = z
    .object({
      prompt: z.string().min(1).max(8000),
      theme: z.string().optional(),
      model: z.string().optional(),
      outline: z.object({ title: z.string().optional(), slides: z.array(z.object({ title: z.string(), intent: z.string().optional() })) }).optional(),
    })
    .parse(req.body);
  const { entry } = resolveModel(body.model);
  try {
    const deck = await generateDeck({ prompt: body.prompt, outline: body.outline as any, theme: body.theme, primary: entry.provider });
    return { ok: true, title: deck.title, subtitle: deck.subtitle, theme: deck.theme, slides: deck.slides, provider: deck._provider, fellBack: deck._fellBack };
  } catch (e: any) {
    req.log.warn({ err: e?.message }, "deck/generate error");
    return reply.code(502).send({ error: e?.message || "deck_failed" });
  }
});

// Translate a whole deck into a target language.
app.post("/studio/deck/translate", async (req, reply) => {
  const body = z.object({
    lang: z.string().min(1).max(40),
    deck: z.object({ title: z.string(), subtitle: z.string().optional(), slides: z.array(z.record(z.unknown())) }),
    model: z.string().optional(),
  }).parse(req.body);
  const { entry } = resolveModel(body.model);
  try {
    const out = await translateDeck({ deck: body.deck as any, lang: body.lang, primary: entry.provider });
    return { ok: true, title: out.title, subtitle: out.subtitle, slides: out.slides, provider: out._provider };
  } catch (e: any) {
    req.log.warn({ err: e?.message }, "deck/translate error");
    return reply.code(502).send({ error: e?.message || "translate_failed" });
  }
});

// Regenerate a single slide.
app.post("/studio/deck/slide", async (req, reply) => {
  const body = z.object({ deckTitle: z.string().default("Presentation"), slide: z.record(z.unknown()), instruction: z.string().max(2000).optional(), model: z.string().optional() }).parse(req.body);
  const { entry } = resolveModel(body.model);
  try {
    const s = await regenerateSlide({ deckTitle: body.deckTitle, slide: body.slide as any, instruction: body.instruction, primary: entry.provider });
    return { ok: true, ...s };
  } catch (e: any) {
    req.log.warn({ err: e?.message }, "deck/slide error");
    return reply.code(502).send({ error: e?.message || "slide_failed" });
  }
});

// ---- Website Studio (gamma/Apple-style full sites) ------------------------
// Plan a site: prompt -> title + brand + ordered section list.
app.post("/studio/website/plan", async (req, reply) => {
  const body = z.object({ prompt: z.string().min(1).max(8000), model: z.string().optional() }).parse(req.body);
  const { entry } = resolveModel(body.model);
  try {
    const plan = await planWebsite(body.prompt, entry.provider);
    return { ok: true, title: plan.title, description: plan.description, brand: plan.brand, sections: plan.sections, provider: plan._provider };
  } catch (e: any) {
    req.log.warn({ err: e?.message }, "website/plan error");
    return reply.code(502).send({ error: e?.message || "plan_failed" });
  }
});

// Generate the full site (plan + every section in parallel + assembled HTML).
app.post("/studio/website", async (req, reply) => {
  const body = z
    .object({
      prompt: z.string().min(1).max(8000),
      model: z.string().optional(),
      plan: z
        .object({
          title: z.string(),
          description: z.string().optional(),
          brand: z.record(z.unknown()),
          sections: z.array(z.object({ id: z.string(), kind: z.string(), brief: z.string() })),
        })
        .optional(),
    })
    .parse(req.body);
  const { entry } = resolveModel(body.model);
  try {
    const site = await generateWebsite({ prompt: body.prompt, plan: body.plan as any, primary: entry.provider });
    return { ok: true, title: site.title, brand: site.brand, sections: site.sections, html: site.html, provider: site.provider };
  } catch (e: any) {
    req.log.warn({ err: e?.message }, "website/generate error");
    return reply.code(502).send({ error: e?.message || "website_failed" });
  }
});

// Regenerate a single section; caller re-assembles.
app.post("/studio/website/section", async (req, reply) => {
  const body = z
    .object({
      siteTitle: z.string().default("Website"),
      sitePrompt: z.string().default(""),
      brand: z.record(z.unknown()),
      section: z.object({ id: z.string(), kind: z.string(), brief: z.string() }),
      model: z.string().optional(),
    })
    .parse(req.body);
  const { entry } = resolveModel(body.model);
  try {
    const sec = await generateSection({ section: body.section as any, brand: body.brand as any, siteTitle: body.siteTitle, sitePrompt: body.sitePrompt, primary: entry.provider });
    return { ok: true, id: sec.id, kind: sec.kind, brief: sec.brief, html: sec.html, provider: sec._provider };
  } catch (e: any) {
    req.log.warn({ err: e?.message }, "website/section error");
    return reply.code(502).send({ error: e?.message || "section_failed" });
  }
});

// Assemble a full HTML doc from an ordered section list (client edits + reorders).
app.post("/studio/website/assemble", async (req) => {
  const body = z.object({ title: z.string().default("Website"), brand: z.record(z.unknown()), sections: z.array(z.object({ html: z.string() })) }).parse(req.body);
  return { ok: true, html: assemble(body.title, body.brand as any, body.sections) };
});

// Defense-in-depth: never let a raw provider/upstream error propagate to the
// transport (it can leak headers and emit a protocol-violating response). Any
// unhandled error returns a clean JSON body with a safe status.
app.setErrorHandler((err: any, req, reply) => {
  const msg = err?.error?.error?.message || err?.message || "internal error";
  req.log.error({ err: msg }, "unhandled error");
  const sc = typeof err?.statusCode === "number" && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;
  if (!reply.sent) reply.code(sc === 400 ? 503 : sc).send({ ok: false, error: "service_error", detail: String(msg).slice(0, 300) });
});

const port = Number(process.env.PORT || 4000);
app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`ai-service on ${port} (provider=${provider.name}, configured=${provider.configured})`);
    startSlaScheduler((o, m) => app.log.info(o, m)); // proactive HITL SLA reminders
  });
