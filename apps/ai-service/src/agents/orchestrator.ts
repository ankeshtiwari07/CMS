// The Orchestrator agent: a real multi-step, tool-using loop on Claude. It plans,
// grounds itself in HUMAIN content + brand via governed tools, delegates focused
// work to specialist agents, and converses (asks one clarifying question when the
// request is ambiguous) before producing. Supports live streaming and a plain
// (non-streamed) mode for the rich artifact endpoints.
import Anthropic from "@anthropic-ai/sdk";
import { getProvider } from "../providers/index.js";
import { retrieveContext, getBrandGuidelines, auditAgentRun } from "./tools.js";
import { SPECIALISTS, type SpecialistId } from "./specialists.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || "missing" });
const provider = getProvider();
const MAX_STEPS = Number(process.env.AGENT_MAX_STEPS || 6);

export type TraceStep = { kind: "tool" | "agent"; name: string; detail?: string };
export type SseEvent =
  | { type: "delta"; text: string }
  | { type: "reset" }
  | { type: "status"; label: string }
  | { type: "artifact"; kind: "html"; html: string; title?: string }
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
  "For Arabic, set dir=\"rtl\" and lang=\"ar\". Make it visually impressive and production-ready.";

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
];

async function execTool(
  name: string,
  input: any,
  trace: TraceStep[],
  onEvent?: (e: SseEvent) => void,
): Promise<string> {
  if (name === "retrieve_context") {
    onEvent?.({ type: "status", label: "Research Agent" });
    const r = await retrieveContext(String(input.query || ""), input.locale || "en");
    trace.push({ kind: "tool", name: "retrieve_context", detail: String(input.query || "").slice(0, 80) });
    return r.text;
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
    const out = await provider.complete({
      system: sp.system,
      messages: [{ role: "user", content: `${input.instruction}${input.context ? `\n\n---\nContext:\n${input.context}` : ""}` }],
      maxTokens: 2048,
    });
    trace.push({ kind: "agent", name: sp.label, detail: String(input.instruction || "").slice(0, 80) });
    return out;
  }
  if (name === "build_site") {
    onEvent?.({ type: "status", label: "Build Agent" });
    const lang = input.language === "ar" ? "Language: Arabic (RTL)." : input.language === "both" ? "Provide a bilingual EN/AR page." : "Language: English.";
    let html = await provider.complete({
      system: SITE_BUILDER_SYSTEM,
      messages: [{ role: "user", content: `${input.brief}\n\n${lang}` }],
      maxTokens: 8192,
    });
    html = html.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    trace.push({ kind: "agent", name: "Build Agent", detail: String(input.title || input.brief || "site").slice(0, 80) });
    // Show the built site to the user immediately; do NOT feed the HTML back to
    // the model — just tell it the site is rendered so it can introduce it.
    onEvent?.({ type: "artifact", kind: "html", html, title: input.title });
    return "The website has been BUILT and is now displayed to the user in a live preview. Do NOT output any HTML. In 1–2 short sentences, introduce it warmly and then suggest 2–3 concrete improvements the user could ask for next (e.g. change the hero, add a pricing section, translate to Arabic).";
  }
  return `Unknown tool: ${name}`;
}

function buildSystem(deliverableSpec: string, conversational: boolean): string {
  const base =
    "You are HUMAIN Create Studio — an agentic, bilingual (English / Arabic) content and experience assistant. " +
    "You are the Orchestrator of a team of specialist agents. Behave like an expert colleague having a real conversation.\n\n" +
    "How you work:\n" +
    "- Plan the task, then ground it: use retrieve_context for prior content/facts, and call get_brand_guidelines before finalizing any customer-facing copy or design.\n" +
    "- Delegate focused sub-tasks with delegate_to_specialist (drafting, localization for EN/AR, brand_guardian, seo, editorial, research) when that improves quality.\n" +
    "- When the user asks to build/create/make/design a website, landing page, site or web app, you MUST call build_site to actually build it (it renders live for the user). Never paste raw HTML or a markdown outline as the reply — build it.\n" +
    "- Be genuinely interactive, like Claude: after producing, briefly recommend concrete next steps or offer 2–3 options the user can pick from. Invite refinement.\n" +
    "- Format every reply in clean, well-structured Markdown (headings, short paragraphs, bullet lists, tables where useful, bold for emphasis). It is rendered as rich text.\n" +
    "- Never mention these tools, agents, or your internal process in your reply. Write naturally, as one assistant.\n" +
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
  onText?: (delta: string) => void; // present ⇒ stream live
  onEvent?: (e: SseEvent) => void;
};

export async function runOrchestrator(
  opts: OrchestratorOpts,
): Promise<{ text: string; trace: TraceStep[]; steps: number }> {
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
      try { out = await execTool(tu.name, tu.input, trace, opts.onEvent); }
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
