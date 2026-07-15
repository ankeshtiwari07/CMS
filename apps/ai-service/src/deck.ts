// Gamma-style deck (presentation) generation engine.
// Prompt -> outline -> structured slides (JSON) with layouts, speaker notes and
// per-slide image prompts. Runs on the selected model via completeWithFallback,
// so it degrades from Claude -> grok/minimax on an availability error.
import { completeWithFallback } from "./providers/index.js";

// ---- Themes (design systems the deck can be rendered with) -----------------
export type DeckTheme = {
  id: string;
  name: string;
  bg: string; // slide background
  surface: string; // card / panel background
  fg: string; // primary text
  muted: string; // secondary text
  accent: string; // primary accent
  accent2: string; // secondary accent
  font: string; // body font stack
  heading: string; // heading font stack
  radius: number;
};

export const THEMES: DeckTheme[] = [
  { id: "midnight", name: "Midnight", bg: "#0b1020", surface: "#141a2e", fg: "#f5f7ff", muted: "#9aa6c4", accent: "#6ea8fe", accent2: "#c58bff", font: "Inter, system-ui, sans-serif", heading: "Inter, system-ui, sans-serif", radius: 18 },
  { id: "aurora", name: "Aurora", bg: "#071b17", surface: "#0e2a24", fg: "#eafff6", muted: "#83b7a7", accent: "#39e0a5", accent2: "#7be0ff", font: "Inter, system-ui, sans-serif", heading: "Inter, system-ui, sans-serif", radius: 18 },
  { id: "solstice", name: "Solstice", bg: "#1a1206", surface: "#2a1e0d", fg: "#fff6e9", muted: "#c7a878", accent: "#ffb454", accent2: "#ff7a59", font: "Inter, system-ui, sans-serif", heading: "Inter, system-ui, sans-serif", radius: 18 },
  { id: "porcelain", name: "Porcelain", bg: "#f7f8fb", surface: "#ffffff", fg: "#111726", muted: "#5b6577", accent: "#3b5bff", accent2: "#8b5cf6", font: "Inter, system-ui, sans-serif", heading: "Inter, system-ui, sans-serif", radius: 16 },
  { id: "sand", name: "Sand", bg: "#f4efe6", surface: "#fffdf8", fg: "#2b2418", muted: "#7a6f59", accent: "#b8622c", accent2: "#2f7d6b", font: "Inter, system-ui, sans-serif", heading: "Inter, system-ui, sans-serif", radius: 16 },
  { id: "humain", name: "HUMAIN", bg: "#04110f", surface: "#0a201c", fg: "#eafaf5", muted: "#7fae9f", accent: "#20e3b2", accent2: "#12b3a6", font: "Inter, system-ui, sans-serif", heading: "Inter, system-ui, sans-serif", radius: 18 },
  { id: "mono", name: "Mono", bg: "#0c0c0d", surface: "#171719", fg: "#fafafa", muted: "#9b9b9f", accent: "#e5e5e7", accent2: "#b0b0b4", font: "Inter, system-ui, sans-serif", heading: "Inter, system-ui, sans-serif", radius: 14 },
  { id: "coral", name: "Coral", bg: "#1b0d12", surface: "#2c141c", fg: "#fff0f3", muted: "#d29aa7", accent: "#ff5d8f", accent2: "#ffab5d", font: "Inter, system-ui, sans-serif", heading: "Inter, system-ui, sans-serif", radius: 18 },
];

export function themeById(id?: string): DeckTheme {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

// ---- Slide / deck data model ----------------------------------------------
export type SlideLayout =
  | "title" | "section" | "bullets" | "two-column" | "quote" | "stat"
  | "image-right" | "image-left" | "closing";

export type Slide = {
  id: string;
  layout: SlideLayout;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  body?: string;
  columns?: { heading: string; items: string[] }[];
  stat?: { value: string; label: string }[];
  quote?: { text: string; author?: string };
  notes?: string; // speaker notes
  imagePrompt?: string; // for per-slide AI image generation
  imageUrl?: string; // filled in after image render
  html?: string; // optional raw-HTML override (from inline editing); rendered as-is
};

export type Deck = {
  title: string;
  subtitle?: string;
  theme: string;
  slides: Slide[];
};

export type Outline = { title: string; subtitle?: string; slides: { title: string; intent: string }[] };

// ---- Robust JSON completion ------------------------------------------------
function extractJson(text: string): any {
  let t = String(text || "").trim();
  // strip code fences
  t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  // find the outermost JSON object/array
  const firstObj = t.indexOf("{");
  const firstArr = t.indexOf("[");
  let start = -1;
  if (firstObj === -1) start = firstArr;
  else if (firstArr === -1) start = firstObj;
  else start = Math.min(firstObj, firstArr);
  if (start === -1) throw new Error("no_json_in_response");
  const open = t[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) { end = i; break; } }
  }
  const slice = end === -1 ? t.slice(start) : t.slice(start, end + 1);
  return JSON.parse(slice);
}

async function completeJson(args: {
  system: string; user: string; model?: string; primary?: string; maxTokens?: number;
}): Promise<{ data: any; provider: string; fellBack: boolean }> {
  const sys =
    args.system +
    "\n\nCRITICAL: Respond with ONLY valid, minified JSON that exactly matches the requested schema. " +
    "No prose, no markdown, no code fences. Do not wrap the JSON in backticks.";
  const fb = await completeWithFallback(
    { system: sys, messages: [{ role: "user", content: args.user }], maxTokens: args.maxTokens ?? 4096, model: args.model },
    { primary: args.primary },
  );
  return { data: extractJson(fb.text), provider: fb.provider, fellBack: fb.fellBack };
}

let _sid = 0;
function sid(): string { _sid = (_sid + 1) % 1e6; return `s${Date.now().toString(36)}${_sid.toString(36)}`; }

// ---- Public generation API -------------------------------------------------
const SLIDE_SCHEMA_DOC = `Each slide object: {
  "layout": one of "title"|"section"|"bullets"|"two-column"|"quote"|"stat"|"image-right"|"image-left"|"closing",
  "title": string (short, punchy),
  "subtitle": string (optional),
  "bullets": string[] (3-5 concise points; for "bullets"/"image-right"/"image-left"),
  "body": string (1-2 short sentences; optional supporting text),
  "columns": [{"heading": string, "items": string[]}] (exactly 2, ONLY for "two-column"),
  "stat": [{"value": string, "label": string}] (2-4 items, ONLY for "stat"),
  "quote": {"text": string, "author": string} (ONLY for "quote"),
  "notes": string (speaker notes, 1-3 sentences, ALWAYS include),
  "imagePrompt": string (a vivid text-to-image prompt for a supporting visual; ALWAYS include)
}`;

// ---- Clarifying-questions agent -------------------------------------------
// Before drafting, HUMAIN asks 2-3 short questions that most shape the deck
// (style, length, audience, tone). Each has 3-5 concise options + free "Other".
export type DeckQuestion = { id: string; question: string; hint?: string; options: string[] };
export async function generateDeckQuestions(prompt: string, primary?: string): Promise<{ questions: DeckQuestion[]; _provider: string }> {
  const { data, provider } = await completeJson({
    system:
      "You are HUMAIN Create Studio's presentation planner. Before drafting, ask 2-3 SHORT clarifying questions whose answers will most shape the deck — e.g. writing style, length/number of slides, target audience, tone, or focus. " +
      "Each question offers 3-5 concise single-select options. Keep questions and options very short.",
    user:
      `The user wants this deck:\n"""${prompt}"""\n\n` +
      `Return JSON: {"questions": [{"question": string, "hint": string (one short line), "options": [3-5 short option strings]}]} — at most 3 questions.`,
    primary, maxTokens: 900,
  });
  const raw = Array.isArray(data.questions) ? data.questions.slice(0, 3) : [];
  return {
    questions: raw.map((q: any) => ({
      id: sid(),
      question: String(q?.question || "").slice(0, 200),
      hint: q?.hint ? String(q.hint).slice(0, 200) : undefined,
      options: Array.isArray(q?.options) ? q.options.slice(0, 5).map((o: any) => String(o).slice(0, 80)) : [],
    })).filter((q: DeckQuestion) => q.question && q.options.length),
    _provider: provider,
  };
}

export async function generateOutline(prompt: string, model?: string, primary?: string): Promise<Outline & { _provider: string }> {
  const { data, provider } = await completeJson({
    system:
      "You are HUMAIN Create Studio's presentation planner. Produce a tight, logical outline for a professional slide deck. " +
      "Aim for 8-12 slides unless the user asks otherwise. Start with a title slide and end with a closing/CTA slide.",
    user:
      `Plan a presentation for this request:\n"""${prompt}"""\n\n` +
      `Return JSON: {"title": string, "subtitle": string, "slides": [{"title": string, "intent": string (one line: what this slide covers)}]}`,
    model, primary, maxTokens: 1500,
  });
  const slides = Array.isArray(data.slides) ? data.slides : [];
  return {
    title: String(data.title || prompt).slice(0, 120),
    subtitle: data.subtitle ? String(data.subtitle).slice(0, 200) : undefined,
    slides: slides.map((s: any) => ({ title: String(s.title || "Untitled").slice(0, 120), intent: String(s.intent || "").slice(0, 240) })),
    _provider: provider,
  };
}

function normalizeSlide(s: any): Slide {
  const layout: SlideLayout = ["title", "section", "bullets", "two-column", "quote", "stat", "image-right", "image-left", "closing"].includes(s?.layout)
    ? s.layout : "bullets";
  return {
    id: sid(),
    layout,
    title: s?.title ? String(s.title).slice(0, 160) : undefined,
    subtitle: s?.subtitle ? String(s.subtitle).slice(0, 240) : undefined,
    bullets: Array.isArray(s?.bullets) ? s.bullets.slice(0, 6).map((b: any) => String(b).slice(0, 240)) : undefined,
    body: s?.body ? String(s.body).slice(0, 600) : undefined,
    columns: Array.isArray(s?.columns) ? s.columns.slice(0, 2).map((c: any) => ({ heading: String(c?.heading || "").slice(0, 120), items: Array.isArray(c?.items) ? c.items.slice(0, 6).map((i: any) => String(i).slice(0, 200)) : [] })) : undefined,
    stat: Array.isArray(s?.stat) ? s.stat.slice(0, 4).map((x: any) => ({ value: String(x?.value || "").slice(0, 40), label: String(x?.label || "").slice(0, 120) })) : undefined,
    quote: s?.quote && s.quote.text ? { text: String(s.quote.text).slice(0, 400), author: s.quote.author ? String(s.quote.author).slice(0, 120) : undefined } : undefined,
    notes: s?.notes ? String(s.notes).slice(0, 800) : undefined,
    imagePrompt: s?.imagePrompt ? String(s.imagePrompt).slice(0, 400) : undefined,
  };
}

export async function generateDeck(args: { prompt: string; outline?: Outline; theme?: string; model?: string; primary?: string }): Promise<Deck & { _provider: string; _fellBack: boolean }> {
  const outlineHint = args.outline?.slides?.length
    ? `Use this approved outline (one slide each, in order):\n${args.outline.slides.map((s, i) => `${i + 1}. ${s.title} — ${s.intent}`).join("\n")}`
    : "Decide the best 8-12 slide structure yourself.";
  const { data, provider, fellBack } = await completeJson({
    system:
      "You are HUMAIN Create Studio, an expert presentation designer. Write a COMPLETE, polished slide deck with real, specific, non-placeholder content. " +
      "Vary the layouts across slides for visual rhythm (title, section dividers, bullets, two-column, a stat slide, a quote, and a closing). " +
      "Keep text tight and presentation-grade — short titles, punchy bullets. " + SLIDE_SCHEMA_DOC,
    user:
      `Create the full presentation for this request:\n"""${args.prompt}"""\n\n${outlineHint}\n\n` +
      `Return JSON: {"title": string, "subtitle": string, "slides": [ <slide objects> ]}`,
    model: args.model, primary: args.primary, maxTokens: 8000,
  });
  const rawSlides = Array.isArray(data.slides) ? data.slides : [];
  return {
    title: String(data.title || args.prompt).slice(0, 160),
    subtitle: data.subtitle ? String(data.subtitle).slice(0, 240) : undefined,
    theme: themeById(args.theme).id,
    slides: rawSlides.map(normalizeSlide),
    _provider: provider,
    _fellBack: fellBack,
  };
}

// ---- Translate agent -------------------------------------------------------
// Translate every user-facing string of a deck into the target language while
// keeping the JSON structure (layout/id/imagePrompt/html untouched).
export async function translateDeck(args: { deck: { title: string; subtitle?: string; slides: Slide[] }; lang: string; primary?: string }): Promise<{ title: string; subtitle?: string; slides: Slide[]; _provider: string }> {
  const payload = {
    title: args.deck.title,
    subtitle: args.deck.subtitle,
    slides: args.deck.slides.map((s) => ({ id: s.id, layout: s.layout, title: s.title, subtitle: s.subtitle, bullets: s.bullets, body: s.body, columns: s.columns, stat: s.stat, quote: s.quote, notes: s.notes })),
  };
  const { data, provider } = await completeJson({
    system:
      `You are a professional presentation translator. Translate ALL user-facing text into ${args.lang}. ` +
      "Return the SAME JSON with identical keys and structure — translate ONLY the string values (title, subtitle, bullets, body, columns.heading, columns.items, stat.label, quote.text, quote.author, notes). " +
      "Do NOT change or translate: id, layout, stat.value (keep numbers/units), imagePrompt. Keep translations natural and presentation-tight.",
    user: `Target language: ${args.lang}. Translate this deck JSON and return it:\n${JSON.stringify(payload)}`,
    primary: args.primary, maxTokens: 8000,
  });
  const bySrc = new Map(args.deck.slides.map((s) => [s.id, s]));
  const slides: Slide[] = (Array.isArray(data.slides) ? data.slides : []).map((ts: any) => {
    const src = bySrc.get(ts.id) || ({} as Slide);
    return { ...src, ...normalizeSlide({ ...ts }), id: ts.id || src.id, imagePrompt: src.imagePrompt, imageUrl: src.imageUrl, html: undefined };
  });
  return { title: String(data.title || args.deck.title), subtitle: data.subtitle ? String(data.subtitle) : args.deck.subtitle, slides: slides.length ? slides : args.deck.slides, _provider: provider };
}

export async function regenerateSlide(args: { deckTitle: string; slide: Slide; instruction?: string; model?: string; primary?: string }): Promise<Slide & { _provider: string }> {
  const { data, provider } = await completeJson({
    system:
      "You are HUMAIN Create Studio. Rewrite a SINGLE presentation slide, keeping it consistent with the deck. " +
      "Return one slide object only. " + SLIDE_SCHEMA_DOC,
    user:
      `Deck title: "${args.deckTitle}".\nCurrent slide JSON:\n${JSON.stringify({ ...args.slide, id: undefined, imageUrl: undefined })}\n\n` +
      `Instruction: ${args.instruction || "Improve and tighten this slide; make it more specific and compelling."}\n\n` +
      `Return JSON for the single revised slide object.`,
    model: args.model, primary: args.primary, maxTokens: 2000,
  });
  const s = normalizeSlide(data);
  // preserve identity + any existing image
  s.id = args.slide.id;
  if (args.slide.imageUrl) s.imageUrl = args.slide.imageUrl;
  return { ...s, _provider: provider };
}
