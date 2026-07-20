// The Orchestrator agent: a real multi-step, tool-using loop on Claude. It plans,
// grounds itself in HUMAIN content + brand via governed tools, delegates focused
// work to specialist agents, and converses (asks one clarifying question when the
// request is ambiguous) before producing. Supports live streaming and a plain
// (non-streamed) mode for the rich artifact endpoints.
import Anthropic from "@anthropic-ai/sdk";
import { providerByName, completeWithFallback } from "../providers/index.js";
import { generateWebsite } from "../website.js";
import { retrieveContext, getBrandGuidelines, getComponents, auditAgentRun } from "./tools.js";
import { SPECIALISTS, type SpecialistId } from "./specialists.js";
import { prompts } from "../prompts/library.js";

const stripJson = (s: string) => s.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "missing",
  maxRetries: Number(process.env.ANTHROPIC_MAX_RETRIES ?? 0),
  timeout: Number(process.env.ANTHROPIC_TIMEOUT_MS ?? 30000),
});
const MAX_STEPS = Number(process.env.AGENT_MAX_STEPS || 6);

// Brace-matched JSON object extractor — robust to fences, leading prose and a
// truncated tail (returns the first balanced {...}). Used by the build_* tools
// so a partial/degraded model reply can't leak raw JSON as user-facing content.
function extractJsonObj(text: string): any {
  let t = stripJson(String(text || ""));
  const s = t.indexOf("{");
  if (s === -1) throw new Error("no_json");
  let d = 0, inStr = false, esc = false, e = -1;
  for (let i = s; i < t.length; i++) {
    const c = t[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') inStr = !inStr;
    else if (!inStr) { if (c === "{") d++; else if (c === "}") { d--; if (!d) { e = i; break; } } }
  }
  return JSON.parse(e === -1 ? t.slice(s) : t.slice(s, e + 1));
}
const looksLikeJson = (s: string) => /^\s*[\[{]/.test(String(s || ""));

export type TraceStep = { kind: "tool" | "agent"; name: string; detail?: string };
export type DocArtifact = {
  type: string;
  title: string;
  summary?: string;
  bodyMarkdown: string;
  seo?: { title?: string; description?: string; keywords?: string[] };
  tags?: string[];
  category?: string;
  language?: string;
};
export type SseEvent =
  | { type: "delta"; text: string }
  | { type: "reset" }
  | { type: "status"; label: string }
  | {
      type: "artifact";
      kind: "html" | "doc" | "video" | "image" | "brand" | "theme";
      html?: string; doc?: DocArtifact;
      script?: string; videoPrompt?: string;
      imagePrompt?: string; ratio?: string;
      brand?: any; theme?: any;
      sections?: any; // structured sections carried with an html artifact (enables edit_site)
      title?: string;
    }
  | { type: "agents"; trace: TraceStep[] };

// Single-file responsive site the Build Agent produces (rendered live in-chat).
const SITE_BUILDER_SYSTEM =
  "You are the Build Agent — an expert front-end engineer for HUMAIN Create Studio. " +
  "Build a COMPLETE, polished, responsive, single-file landing page or web app. " +
  "Return ONLY valid HTML starting with <!doctype html> and nothing else (no markdown fences, no commentary). " +
  "Use inline <style> with modern CSS (flex/grid, system font stack), genuinely on-brand for HUMAIN " +
  "(primary teal #00A18B, dark ink #0B1416, lime accent #C2E54B, generous whitespace, rounded corners, tasteful gradients and motion). " +
  "Include real, specific copy (not lorem) for: a sticky header with the HUMAIN wordmark + nav, a hero with headline/subhead/CTA, " +
  "a 3-up features section, a stats or logos strip, a testimonial, a closing CTA band, and a footer. " +
  "If a COMPONENT LIBRARY is provided in the message, ASSEMBLE the page primarily from those admin-curated blocks — reuse their HTML/structure and replace any {{placeholders}} with real copy; only invent sections the library does not cover. " +
  "For Arabic, set dir=\"rtl\" and lang=\"ar\". Make it visually impressive and production-ready.";

// Structured content the Content Agent produces (rendered as an editable card).
const CONTENT_BUILDER_SYSTEM =
  "You are the Content Agent for HUMAIN Create Studio. Produce a complete, on-brand, publish-ready content piece. " +
  "Return ONLY valid JSON (no markdown fences, no commentary) matching exactly:\n" +
  '{"title": string, "summary": string (<=200 chars), "bodyMarkdown": string (the full piece in rich Markdown — headings, lists, tables, emphasis), ' +
  '"seo": {"title": string (<=60), "description": string (<=160), "keywords": string[]}, "tags": string[] (3-8), "category": string}\n' +
  "Write real, specific, substantial content — not placeholders. Match HUMAIN's confident, clear, forward-looking voice.";

// Video package the Video Agent produces (rendered + one-click render in chat).
const VIDEO_SYSTEM =
  "You are the Video Agent for HUMAIN Create Studio, a creative director. Produce a production-ready video package in Markdown: " +
  "Logline; Concept & tone; Target duration; Script (scene-by-scene — Visual / Voiceover / On-screen text); Shot list; Storyboard notes; Music & pacing. " +
  "End with one line beginning 'VIDEO_PROMPT:' followed by a single vivid paragraph (<500 chars) for a text-to-video model.";

// Brand guideline the Brand Agent produces (rendered as a verifiable card).
const BRAND_SYSTEM =
  "You are the Brand Agent for HUMAIN Create Studio. Produce a brand guideline as COMPACT, valid JSON (no fences, no commentary). " +
  "ALWAYS include a palette of 4–6 colours. Schema: " +
  '{"name": string, "summary": string (<=160 chars), "palette": [{"name": string, "hex": "#RRGGBB", "usage": string}], ' +
  '"sections": [{"title": string, "content": string}]}. ' +
  "Cover 5–7 sections (Voice & Tone, Positioning, Messaging Pillars, Typography, Logo Usage, Imagery), each 2–4 sentences of concise Markdown. " +
  "Use concrete hex codes and real font names. Keep it tight so the JSON is complete.";

// Publishable CMS modules the content can be sent to (slug → human label).
export const PUBLISH_TARGETS: Record<string, string> = {
  blogPosts: "Blog Post", articles: "Article", pressReleases: "Press Release",
  pages: "Page", events: "Event", caseStudies: "Case Study", products: "Product",
  faqs: "FAQ", campaignMicrosites: "Campaign Microsite", mediaGalleries: "Media Gallery",
};

const TOOLS: Anthropic.Tool[] = [
  {
    name: "retrieve_context",
    description:
      "Search HUMAIN's own published content (semantic, Arabic-aware RAG) to ground the work in real, on-brand material. Use when prior content, facts or house style would help.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string" }, locale: { type: "string", enum: ["en", "ar"] } },
      required: ["query"],
    },
  },
  {
    name: "list_components",
    description:
      "List the LIVE building-block components in the CMS component library (name, type, description, HTML). ALWAYS call this before build_site so you ASSEMBLE the page by reusing these admin-curated, on-brand blocks (adapt their HTML, fill placeholders with real copy) instead of inventing markup from scratch.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_brand_guidelines",
    description:
      "Fetch HUMAIN brand voice, messaging and visual tokens. Call before finalizing any customer-facing copy or design.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "delegate_to_specialist",
    description:
      "Delegate a focused sub-task to a specialist agent and get its result. Divide complex work: drafting, localization (EN/AR), brand_guardian (brand check), seo (metadata/tags), editorial (review notes), research (synthesize context).",
    input_schema: {
      type: "object",
      properties: {
        agent: { type: "string", enum: Object.keys(SPECIALISTS) },
        instruction: { type: "string" },
        context: { type: "string" },
      },
      required: ["agent", "instruction"],
    },
  },
  {
    name: "build_site",
    description:
      "Actually BUILD a website / landing page / web app and display it live to the user (rendered in an in-chat preview). Use this whenever the user asks to build, create, make or design a website/landing page/site/web app — do not describe it in text, build it. The user sees the rendered result; you only briefly introduce it.",
    input_schema: {
      type: "object",
      properties: {
        brief: { type: "string", description: "A rich brief: purpose, audience, sections, tone, key copy." },
        language: { type: "string", enum: ["en", "ar", "both"] },
        title: { type: "string" },
      },
      required: ["brief"],
    },
  },
  {
    name: "edit_site",
    description:
      "EDIT the website already built and shown to the user, in place — do NOT rebuild from scratch. Use this for any follow-up change to the current site: change/restyle the hero, edit copy, add or remove a section, reorder sections, translate it, change colours. Give a clear instruction; only the affected sections are regenerated and the updated preview is shown.",
    input_schema: {
      type: "object",
      properties: {
        instruction: { type: "string", description: "What to change about the current site, in plain language." },
      },
      required: ["instruction"],
    },
  },
  {
    name: "build_content",
    description:
      "Produce a complete, structured CONTENT piece and display it as an interactive, editable, publishable card (the user can edit it, download it, or publish it to a CMS module). Use this for any substantive text deliverable: article, blog post, page, press release, event write-up, product copy, case study, FAQ, marketing email, campaign, or social post. Do NOT dump the content as a plain chat reply — build it as a card.",
    input_schema: {
      type: "object",
      properties: {
        contentType: { type: "string", description: "blogPosts | articles | pressReleases | pages | events | caseStudies | products | faqs | email | campaign | social | generic" },
        brief: { type: "string", description: "What to write — topic, angle, audience, length, key points." },
        title: { type: "string" },
        language: { type: "string", enum: ["en", "ar", "both"] },
      },
      required: ["contentType", "brief"],
    },
  },
  {
    name: "build_video",
    description:
      "Create a VIDEO: produce a production-ready script/storyboard and display it with a one-click Render control that generates a real video. Use whenever the user asks for a video, ad, teaser, reel or motion piece.",
    input_schema: {
      type: "object",
      properties: { brief: { type: "string" }, title: { type: "string" } },
      required: ["brief"],
    },
  },
  {
    name: "build_image",
    description:
      "Generate an IMAGE and display it inline. Use whenever the user asks for an image, picture, illustration, poster, graphic or visual. Write a vivid, detailed image prompt.",
    input_schema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "A vivid, detailed image description (subject, style, lighting, palette, composition)." },
        ratio: { type: "string", description: "aspect ratio e.g. 1:1, 16:9, 3:4" },
        title: { type: "string" },
      },
      required: ["prompt"],
    },
  },
  {
    name: "build_brand",
    description:
      "Create a BRAND GUIDELINE and display it as a verifiable card the user can edit, publish (set as the active brand or save to the library) or download. Use whenever the user asks for a brand, brand identity, brand guideline or visual identity.",
    input_schema: {
      type: "object",
      properties: { brief: { type: "string" }, title: { type: "string" } },
      required: ["brief"],
    },
  },
  {
    name: "build_theme",
    description:
      "Generate a DESIGN THEME (colour palette, font, radius, light/dark) from a description and display it with live swatches and an Apply control. Use whenever the user asks for a theme, colour scheme, design system or visual style for the product/site.",
    input_schema: {
      type: "object",
      properties: { brief: { type: "string" }, title: { type: "string" } },
      required: ["brief"],
    },
  },
];

// Same tools, in OpenAI function-calling shape — for the compat (non-Claude)
// agentic loop, so the agent can run on MiniMax / HUMAIN gateway / any OpenAI-
// compatible model.
const OA_TOOLS = TOOLS.map((t) => ({ type: "function" as const, function: { name: t.name, description: t.description, parameters: t.input_schema } }));

async function execTool(
  name: string,
  input: any,
  trace: TraceStep[],
  onEvent?: (e: SseEvent) => void,
  activeProvider = "anthropic",
  currentSite?: { title: string; brand: any; sections: any[] } | null,
): Promise<string> {
  // Run a sub-generation on the SAME live provider the loop is running on (with
  // the configured fallback chain), never the module-level default which may be
  // a dead sovereign box.
  const gen = (system: string, content: string, maxTokens: number) =>
    completeWithFallback({ system, messages: [{ role: "user", content }], maxTokens }, { primary: activeProvider }).then((r) => r.text);
  if (name === "retrieve_context") {
    onEvent?.({ type: "status", label: "Research Agent" });
    const r = await retrieveContext(String(input.query || ""), input.locale || "en");
    trace.push({ kind: "tool", name: "retrieve_context", detail: String(input.query || "").slice(0, 80) });
    return r.text;
  }
  if (name === "list_components") {
    const out = await getComponents();
    trace.push({ kind: "tool", name: "list_components" });
    return out.text;
  }
  if (name === "get_brand_guidelines") {
    onEvent?.({ type: "status", label: "Brand Guardian Agent" });
    const r = await getBrandGuidelines();
    trace.push({ kind: "tool", name: "get_brand_guidelines" });
    return r.text;
  }
  if (name === "delegate_to_specialist") {
    const sp = SPECIALISTS[input.agent as SpecialistId];
    if (!sp) return `Unknown specialist: ${input.agent}`;
    onEvent?.({ type: "status", label: sp.label });
    const out = await gen(sp.system, `${input.instruction}${input.context ? `\n\n---\nContext:\n${input.context}` : ""}`, 2048);
    trace.push({ kind: "agent", name: sp.label, detail: String(input.instruction || "").slice(0, 80) });
    return out;
  }
  if (name === "build_site") {
    onEvent?.({ type: "status", label: "Build Agent" });
    const lang = input.language === "ar" ? "Language: Arabic (RTL)." : input.language === "both" ? "Provide a bilingual EN/AR page." : "Language: English.";
    // Ground the build in the admin-curated component library so pages are
    // ASSEMBLED from on-brand building blocks, not invented from scratch.
    const lib = await getComponents();
    const libNote =
      lib.ok && lib.text && !/empty|unavailable/i.test(lib.text)
        ? `\n\n=== CMS COMPONENT LIBRARY (reuse these building blocks) ===\nAssemble the page primarily from these admin-curated components. Adapt their HTML, keep their structure/classes, and REPLACE any {{placeholders}} with real, specific copy. Only invent new sections when the library lacks a needed block:\n${lib.text}`
        : "";
    if (libNote) trace.push({ kind: "tool", name: "list_components" });
    // Build with the section-by-section engine on CLAUDE (falls back to MiniMax).
    // The chat's default provider (LLM_PROVIDER=haow-v4) has a ~4096-token context,
    // so a single-shot maxTokens:8192 build always 400s. generateWebsite runs on
    // Claude, section by section (no token-limit issue), and assembles a full,
    // component-based page — the same engine as the Website Studio.
    void libNote; // library consultation is handled inside generateWebsite
    const site = await generateWebsite({ prompt: `${input.brief}\n\n${lang}`, primary: activeProvider });
    let html = site.html;
    trace.push({ kind: "agent", name: "Build Agent", detail: String(input.title || input.brief || "site").slice(0, 80) });
    // Show the built site to the user immediately; do NOT feed the HTML back to
    // the model — just tell it the site is rendered so it can introduce it.
    onEvent?.({ type: "artifact", kind: "html", html, title: input.title, sections: site.sections, brand: site.brand });
    return "The website has been BUILT and is now displayed to the user in a live preview. Do NOT output any HTML. In 1–2 short sentences, introduce it warmly and then suggest 2–3 concrete improvements the user could ask for next (e.g. change the hero, add a pricing section, translate to Arabic). If they ask for any of those, use edit_site (not build_site) so their site is edited in place.";
  }
  if (name === "edit_site") {
    onEvent?.({ type: "status", label: "Edit Agent" });
    if (!currentSite || !Array.isArray(currentSite.sections) || !currentSite.sections.length) {
      return "There is no current website to edit yet. Build one first with build_site, then I can edit it in place.";
    }
    const { WebsiteBuilder } = await import("./website-builder.js");
    const res = await new WebsiteBuilder(activeProvider).updateWebsite(
      { title: currentSite.title, brand: currentSite.brand, sections: currentSite.sections as any },
      String(input.instruction || ""),
    );
    trace.push({ kind: "agent", name: "Edit Agent", detail: String(input.instruction || "").slice(0, 80) });
    onEvent?.({ type: "artifact", kind: "html", html: res.html, title: currentSite.title, sections: res.sections, brand: res.brand });
    return `The website has been EDITED IN PLACE (${res.changed.length} section${res.changed.length === 1 ? "" : "s"} updated) and the refreshed preview is now shown. Do NOT output any HTML. In ONE short sentence, confirm what changed and invite the next tweak.`;
  }
  if (name === "build_content") {
    onEvent?.({ type: "status", label: "Content Agent" });
    const lang = input.language === "ar" ? "Write in Arabic." : input.language === "both" ? "Provide bilingual EN + AR." : "Write in English.";
    const raw = await gen(CONTENT_BUILDER_SYSTEM, `Content type: ${input.contentType}\n${input.brief}\n\n${lang}`, 4096);
    let doc: DocArtifact;
    try {
      const j = extractJsonObj(raw);
      doc = {
        type: input.contentType || "generic",
        title: String(j.title || input.title || "Untitled"),
        summary: j.summary,
        bodyMarkdown: String(j.bodyMarkdown || j.body || ""),
        seo: j.seo, tags: Array.isArray(j.tags) ? j.tags : undefined, category: j.category,
        language: input.language || "en",
      };
      if (!doc.bodyMarkdown.trim()) throw new Error("empty_body");
    } catch {
      // Parse failed — NEVER dump raw JSON into the card. If the reply is
      // JSON-shaped, retry once asking for plain Markdown; else use the prose.
      let body = looksLikeJson(raw) ? "" : raw;
      if (!body.trim()) {
        try { body = await gen(CONTENT_BUILDER_SYSTEM + "\n\nReturn ONLY the article body as clean Markdown — NO JSON, no code fences.", `Content type: ${input.contentType}\n${input.brief}\n\n${lang}`, 4096); } catch {}
      }
      if (looksLikeJson(body)) { try { const p = extractJsonObj(body); body = String(p.bodyMarkdown || p.body || ""); } catch { body = ""; } }
      doc = { type: input.contentType || "generic", title: String(input.title || "Untitled"), bodyMarkdown: body || "(The content could not be formatted — please try again.)", language: input.language || "en" };
    }
    trace.push({ kind: "agent", name: "Content Agent", detail: String(input.contentType || "content") });
    onEvent?.({ type: "artifact", kind: "doc", doc, title: doc.title });
    return "The content has been produced and is shown to the user as an editable, publishable card. Do NOT repeat the content. In 1–2 short sentences, introduce it and suggest 2–3 next steps (e.g. adjust tone, translate, publish to a module).";
  }
  if (name === "build_video") {
    onEvent?.({ type: "status", label: "Video Agent" });
    const out = await gen(VIDEO_SYSTEM, String(input.brief || ""), 4096);
    const m = out.match(/VIDEO_PROMPT:\s*([\s\S]+?)(?:\n\n|$)/i);
    const videoPrompt = (m?.[1] || input.brief || "").trim().slice(0, 500);
    trace.push({ kind: "agent", name: "Video Agent", detail: String(input.title || input.brief || "video").slice(0, 80) });
    onEvent?.({ type: "artifact", kind: "video", script: out, videoPrompt, title: input.title });
    return "The video script/storyboard is shown to the user with a one-click Render control (it produces a real video). Do NOT repeat the script. Briefly introduce it and suggest 2–3 tweaks (tone, length, scenes).";
  }
  if (name === "build_image") {
    onEvent?.({ type: "status", label: "Image Agent" });
    const prompt = String(input.prompt || input.brief || "").slice(0, 1000);
    trace.push({ kind: "agent", name: "Image Agent", detail: prompt.slice(0, 80) });
    onEvent?.({ type: "artifact", kind: "image", imagePrompt: prompt, ratio: input.ratio, title: input.title });
    return "The image is being generated and is shown to the user inline. Do NOT describe the pixels. Briefly introduce it and offer 2–3 variations (style, palette, composition, ratio).";
  }
  if (name === "build_brand") {
    onEvent?.({ type: "status", label: "Brand Agent" });
    const raw = await gen(BRAND_SYSTEM, String(input.brief || ""), 4096);
    let brand: any;
    try {
      const j = extractJsonObj(raw);
      brand = { name: j.name || input.title || "Brand Guideline", summary: j.summary || "", palette: Array.isArray(j.palette) ? j.palette : [], sections: Array.isArray(j.sections) ? j.sections : [] };
    } catch {
      brand = { name: input.title || "Brand Guideline", summary: "", palette: [], sections: [{ title: "Guideline", content: raw }] };
    }
    trace.push({ kind: "agent", name: "Brand Agent", detail: String(brand.name).slice(0, 80) });
    onEvent?.({ type: "artifact", kind: "brand", brand, title: brand.name });
    return "The brand guideline is shown to the user as a viewable card they can verify, publish (Active Brand / Library) or download. Do NOT repeat it. Briefly introduce it and suggest next steps.";
  }
  if (name === "build_theme") {
    onEvent?.({ type: "status", label: "Design Agent" });
    const raw = await gen(prompts["theme@v1"].system, String(input.brief || ""), 1024);
    let theme: any = null;
    try { theme = extractJsonObj(raw); } catch { theme = null; }
    if (!theme) return "Could not generate a valid theme. Ask the user to rephrase the look & feel.";
    trace.push({ kind: "agent", name: "Design Agent", detail: String(input.brief || "theme").slice(0, 80) });
    onEvent?.({ type: "artifact", kind: "theme", theme, title: input.title });
    return "The theme is shown to the user with live swatches and an Apply control. Do NOT list raw hex codes at length. Briefly explain the palette choices and invite tweaks.";
  }
  return `Unknown tool: ${name}`;
}

function buildSystem(deliverableSpec: string, conversational: boolean): string {
  const base =
    "You are HUMAIN Create Studio — an agentic, bilingual (English / Arabic) content and experience assistant. " +
    "You are the Orchestrator of a team of specialist agents. Behave like an expert colleague having a real conversation.\n\n" +
    "How you work:\n" +
    "- FIRST decide if the user actually wants something made. Greetings, small talk, questions, advice and brainstorming → just reply naturally and warmly in chat (do NOT build anything, do NOT call tools). Only build when the user clearly asks to create/make/build/write/design something, or has given enough detail to.\n" +
    "- When they do want something made, INTELLIGENTLY pick the right tool and BUILD it as an interactive outcome — never just describe it:\n" +
    "    • website / landing page / web app → first list_components, then build_site (assembles the page from the CMS component library; live preview)\n" +
    "    • EDIT/CHANGE/REFINE the website already shown (change the hero, edit copy, add/remove/reorder a section, restyle, translate it) → edit_site (edits the CURRENT site IN PLACE — never rebuild it with build_site)\n" +
    "    • content piece (article, blog, page, press release, event, product, case study, FAQ, email, campaign, social) → build_content (editable, publishable card)\n" +
    "    • video / ad / teaser / reel → build_video (script + one-click render)\n" +
    "    • image / picture / illustration / poster / graphic → build_image (renders inline)\n" +
    "    • brand / brand identity / brand guideline → build_brand (verifiable, publishable card)\n" +
    "    • theme / colour scheme / design system → build_theme (live swatches + apply)\n" +
    "  If the request is ambiguous, ask ONE short clarifying question before building.\n" +
    "- Plan, then ground: use retrieve_context for prior content/facts, and get_brand_guidelines before finalizing anything customer-facing.\n" +
    "- Delegate focused sub-tasks with delegate_to_specialist (drafting, localization EN/AR, brand_guardian, seo, editorial, research) when it improves quality.\n" +
    "- Be genuinely interactive, like Claude: after producing, briefly recommend concrete next steps or offer 2–3 options the user can pick from. Always invite refinement.\n" +
    "- Format chat replies in clean, well-structured Markdown (headings, short paragraphs, bullet lists, tables, bold). It renders as rich text.\n" +
    "- Never mention these tools, agents, or your internal process. Write naturally, as one assistant.\n" +
    "- House brand: confident, clear, forward-looking. Primary teal #00A18B, dark ink #0B1416, lime accent #C2E54B.\n";
  const convo = conversational
    ? "\nConversation style:\n" +
      "- If the request is missing essentials needed to do it well (audience, language EN/AR/both, length or format, tone, or channel), ask ONE short clarifying question and stop — do not produce yet.\n" +
      "- If the request is clear enough, just do it and present the result.\n" +
      "- For follow-ups, refine the current piece in context — do not restart from scratch.\n"
    : "\nProduce the deliverable directly and completely.\n";
  return `${base}${convo}\n=== DELIVERABLE SPEC ===\n${deliverableSpec}`;
}

export type OrchestratorOpts = {
  deliverableSpec: string;
  conversational: boolean;
  messages: Anthropic.MessageParam[];
  model: string;
  maxTokens: number;
  providerName?: string; // "anthropic" (default) ⇒ Claude loop; else OpenAI-compat tool-use loop
  onText?: (delta: string) => void; // present ⇒ stream live
  onEvent?: (e: SseEvent) => void;
  currentSite?: { title: string; brand: any; sections: any[] } | null; // the site in the canvas, for edit_site
};

export async function runOrchestrator(
  opts: OrchestratorOpts,
): Promise<{ text: string; trace: TraceStep[]; steps: number }> {
  // Non-Claude models run the OpenAI-compatible tool-use loop (MiniMax, HUMAIN
  // sovereign gateway, GPT, Grok, Gemini) — the SAME tools and grounding.
  if (opts.providerName && opts.providerName !== "anthropic") {
    return runCompatLoop(opts);
  }
  const trace: TraceStep[] = [];
  const system = buildSystem(opts.deliverableSpec, opts.conversational);
  const messages: Anthropic.MessageParam[] = [...opts.messages];
  let steps = 0;
  let finalText = "";

  while (steps < MAX_STEPS) {
    steps++;
    let turnText = "";
    const stream = client.messages.stream({
      model: opts.model,
      max_tokens: opts.maxTokens,
      system,
      tools: TOOLS,
      messages,
    });
    if (opts.onText) stream.on("text", (d) => { turnText += d; opts.onText!(d); });
    const msg = await stream.finalMessage();
    if (!opts.onText) {
      turnText = msg.content.filter((b) => b.type === "text").map((b: any) => b.text).join("");
    }
    const toolUses = msg.content.filter((b) => b.type === "tool_use") as Anthropic.ToolUseBlock[];

    if (msg.stop_reason !== "tool_use" || toolUses.length === 0) {
      finalText = turnText;
      break;
    }

    // This turn was interim (it called tools); clear any narration we streamed so
    // the visible reply stays clean, then run the tools and continue the loop.
    if (opts.onText && turnText.trim()) opts.onEvent?.({ type: "reset" });
    messages.push({ role: "assistant", content: msg.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      let out: string;
      try { out = await execTool(tu.name, tu.input, trace, opts.onEvent, "anthropic", opts.currentSite); }
      catch (e: any) { out = `tool error: ${e?.message || e}`; }
      results.push({ type: "tool_result", tool_use_id: tu.id, content: String(out).slice(0, 6000) });
    }
    messages.push({ role: "user", content: results });
  }

  // Safety net: if we hit the step cap without a final answer, force one (no tools).
  if (!finalText) {
    let t = "";
    const stream = client.messages.stream({
      model: opts.model,
      max_tokens: opts.maxTokens,
      system: `${system}\n\nProvide your response to the user now, without using tools.`,
      messages,
    });
    if (opts.onText) stream.on("text", (d) => { t += d; opts.onText!(d); });
    const msg = await stream.finalMessage();
    finalText = opts.onText ? t : msg.content.filter((b) => b.type === "text").map((b: any) => b.text).join("");
  }

  opts.onEvent?.({ type: "agents", trace });
  void auditAgentRun(`agentic run · ${trace.length} agent/tool step${trace.length === 1 ? "" : "s"}`, { trace, steps });
  return { text: finalText, trace, steps };
}

// Convert the incoming (Anthropic-shaped) history to plain OpenAI messages.
function toOpenAIMessages(msgs: Anthropic.MessageParam[]): any[] {
  return msgs.map((m) => {
    const content = typeof m.content === "string"
      ? m.content
      : (m.content as any[]).map((b) => (b?.type === "text" ? b.text : "")).join("");
    return { role: m.role, content };
  });
}

// OpenAI-compatible agentic tool-use loop — mirrors the Claude loop above but
// speaks the function-calling wire format, so the agent (all its tools + brand
// grounding + the component library) runs on any tool-capable OpenAI-compatible
// model (MiniMax, HUMAIN gateway, GPT, Grok, Gemini). Non-streaming: the final
// reply is emitted once at the end; artifacts still stream via onEvent.
async function runCompatLoop(
  opts: OrchestratorOpts,
): Promise<{ text: string; trace: TraceStep[]; steps: number }> {
  const trace: TraceStep[] = [];
  const system = buildSystem(opts.deliverableSpec, opts.conversational);
  const prov = providerByName(opts.providerName as any);
  if (!prov?.chatWithTools) throw new Error(`Provider ${opts.providerName} does not support tool-use`);
  const messages: any[] = toOpenAIMessages(opts.messages);
  let steps = 0;
  let finalText = "";

  while (steps < MAX_STEPS) {
    steps++;
    const { content, toolCalls, assistant } = await prov.chatWithTools({
      system,
      messages,
      tools: OA_TOOLS,
      maxTokens: opts.maxTokens,
      model: opts.model,
    });
    if (!toolCalls.length) { finalText = content; break; }
    // Keep the assistant's tool-call message, then run each tool and feed results back.
    messages.push(assistant && assistant.tool_calls ? assistant : { role: "assistant", content: content || "", tool_calls: toolCalls.map((t) => ({ id: t.id, type: "function", function: { name: t.name, arguments: JSON.stringify(t.args) } })) });
    for (const tc of toolCalls) {
      let out: string;
      try { out = await execTool(tc.name, tc.args, trace, opts.onEvent, opts.providerName, opts.currentSite); }
      catch (e: any) { out = `tool error: ${e?.message || e}`; }
      messages.push({ role: "tool", tool_call_id: tc.id, content: String(out).slice(0, 6000) });
    }
  }

  if (!finalText) {
    // Hit the step cap — ask once more for a plain reply (no tool messages fed in).
    const plain = toOpenAIMessages(opts.messages);
    try { finalText = await prov.complete({ system: `${system}\n\nSummarise what you did for the user now, without using tools.`, messages: plain as any, maxTokens: opts.maxTokens }); }
    catch { finalText = "Done — the requested items were produced."; }
  }
  if (opts.onText && finalText) opts.onText(finalText);
  opts.onEvent?.({ type: "agents", trace });
  void auditAgentRun(`agentic run (${opts.providerName}) · ${trace.length} step${trace.length === 1 ? "" : "s"}`, { trace, steps });
  return { text: finalText, trace, steps };
}
