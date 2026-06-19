import type { LlmProvider, CompleteRequest } from "./types.js";
import { AnthropicProvider } from "./anthropic.js";
import { OpenAICompatProvider, type CompatConfig } from "./openai-compat.js";

// ---- OpenAI-compatible provider configs (GPT, Grok, Gemini) ----
const COMPAT: Record<string, CompatConfig> = {
  openai: {
    name: "openai",
    baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    apiKeyEnv: "OPENAI_API_KEY",
    defaultModel: process.env.OPENAI_MODEL || "gpt-5.5",
    tokenParam: "max_completion_tokens",
  },
  xai: {
    name: "xai",
    baseUrl: process.env.XAI_BASE_URL || "https://api.x.ai/v1",
    apiKeyEnv: "XAI_API_KEY",
    defaultModel: process.env.XAI_MODEL || "grok-4",
    tokenParam: "max_tokens",
  },
  google: {
    name: "google",
    baseUrl: process.env.GOOGLE_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKeyEnv: "GOOGLE_API_KEY",
    defaultModel: process.env.GOOGLE_MODEL || "gemini-2.5-pro",
    tokenParam: "max_tokens",
  },
};

const anthropic = new AnthropicProvider();
const providers: Record<string, LlmProvider> = {
  anthropic,
  openai: new OpenAICompatProvider(COMPAT.openai),
  xai: new OpenAICompatProvider(COMPAT.xai),
  google: new OpenAICompatProvider(COMPAT.google),
};

export function providerByName(name: string): LlmProvider {
  return providers[name] || anthropic;
}

// Default provider — used by the versioned-prompt /run endpoint, RAG worker and
// embeddings (embeddings always run locally regardless of which provider).
export function getProvider(): LlmProvider {
  return providerByName(process.env.LLM_PROVIDER || "anthropic");
}

// ---- Model catalog (the menu users pick from) ----
export type ModelEntry = {
  id: string;
  label: string;
  provider: keyof typeof providers;
  model: string;
  fast?: boolean;
  family: string; // grouping label for the UI
};

export const MODELS: ModelEntry[] = [
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", provider: "anthropic", model: process.env.ANTHROPIC_MODEL || "claude-opus-4-8", family: "Claude" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "anthropic", model: process.env.ANTHROPIC_FAST_MODEL || "claude-haiku-4-5-20251001", fast: true, family: "Claude" },
  { id: "gpt-5.5", label: process.env.OPENAI_LABEL || "GPT-5.5", provider: "openai", model: COMPAT.openai.defaultModel, family: "OpenAI" },
  { id: "grok-4", label: process.env.XAI_LABEL || "Grok 4", provider: "xai", model: COMPAT.xai.defaultModel, family: "Grok" },
  { id: "gemini-2.5-pro", label: process.env.GOOGLE_LABEL || "Gemini 2.5 Pro", provider: "google", model: COMPAT.google.defaultModel, family: "Gemini" },
];

export const DEFAULT_MODEL_ID = "claude-opus-4-8";

export function modelById(id?: string): ModelEntry {
  return MODELS.find((m) => m.id === id) || MODELS.find((m) => m.id === DEFAULT_MODEL_ID)!;
}

// Resolve a model id to the concrete provider instance + model string + fast flag.
export function resolveModel(id?: string): { provider: LlmProvider; model: string; fast: boolean; entry: ModelEntry } {
  const entry = modelById(id);
  return { provider: providerByName(entry.provider), model: entry.model, fast: Boolean(entry.fast), entry };
}

// ---- Provider fallback ----------------------------------------------------
// When the primary provider fails with an AVAILABILITY error (credit balance,
// quota, rate limit, overload, transient 5xx/network), automatically retry on
// the next CONFIGURED provider so AI features degrade instead of hard-failing.
const FALLBACK_ORDER = (process.env.LLM_FALLBACK_ORDER || "anthropic,xai,openai,google")
  .split(",").map((s) => s.trim()).filter(Boolean);

// Only fall back on availability/transient errors — not on genuine bad requests
// (which would fail identically everywhere and just waste calls).
function isAvailabilityError(err: any): boolean {
  const m = (err?.error?.error?.message || err?.message || String(err || "")).toLowerCase();
  return /credit|balance|quota|rate.?limit|429|overload|insufficient|unavailable|timeout|econn|enotfound|fetch failed|temporar|throttl|capacity|\b5\d\d\b|529|premature close|invalid response body|socket|aborted|stream|connection|reset|epipe|empty response|terminated|network/.test(m);
}

export type FallbackResult = { text: string; provider: string; model?: string; fellBack: boolean; tried: string[] };

export async function completeWithFallback(
  req: CompleteRequest,
  opts?: { primary?: string; exclude?: string[] },
): Promise<FallbackResult> {
  const primary = opts?.primary || process.env.LLM_PROVIDER || "anthropic";
  const exclude = new Set(opts?.exclude || []);
  // primary first, then the configured fallback chain (deduped, configured only,
  // minus any explicitly-excluded providers — e.g. one already known to be down).
  const ordered = [primary, ...FALLBACK_ORDER].filter((n, i, a) => a.indexOf(n) === i && !exclude.has(n));
  const list = ordered.filter((n) => providers[n]?.configured);
  const candidates = list.length ? list : [primary];
  const tried: string[] = [];
  let lastErr: any;
  for (const name of candidates) {
    const p = providers[name];
    if (!p) continue;
    tried.push(name);
    try {
      // The requested model id only applies to the primary provider; fallbacks
      // use their own default model (the Claude model string is meaningless on GPT).
      const text = await p.complete({ ...req, model: name === primary ? req.model : undefined });
      return { text, provider: name, model: name === primary ? req.model : undefined, fellBack: name !== primary, tried };
    } catch (e) {
      lastErr = e;
      if (!isAvailabilityError(e)) throw e; // genuine error → don't waste fallbacks
      // else: availability error → try the next configured provider
    }
  }
  throw lastErr || new Error("no_provider_available");
}

// Catalog with live "configured" status for the UI.
export function listModels() {
  return MODELS.map((m) => ({
    id: m.id,
    label: m.label,
    family: m.family,
    provider: m.provider,
    fast: Boolean(m.fast),
    configured: Boolean(providers[m.provider]?.configured),
  }));
}
