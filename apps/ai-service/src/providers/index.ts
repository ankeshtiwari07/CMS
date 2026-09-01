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
  minimax: {
    name: "minimax",
    baseUrl: process.env.MINIMAX_BASE_URL || "https://api.minimax.io/v1",
    apiKeyEnv: "MINIMAX_API_KEY",
    defaultModel: process.env.MINIMAX_MODEL || "MiniMax-M2",
    tokenParam: "max_tokens",
    extraBody: { reasoning_effort: "none" },
  },
  // HUMAIN Create custom model gateway — the single sovereign routing point. All model
  // access can flow through here (Gemini/OpenAI/MiniMax) so application code never calls
  // providers directly. MiniMax is the sovereign default.
  humain: {
    name: "humain",
    baseUrl: process.env.HUMAIN_GATEWAY_URL || "http://model-gateway.humain-create.svc.cluster.local:8080/v1",
    apiKeyEnv: "HUMAIN_GATEWAY_KEY",
    defaultModel: process.env.HUMAIN_GATEWAY_MODEL || "minimax",
    tokenParam: "max_tokens",
  },
  // haow-v4 — our OWN sovereign model (Qwen2.5-7B + LoRA via vLLM on the GPU VM),
  // OpenAI-compatible with tool-calling. Hidden from the picker (test-only for now).
  haowv4: {
    name: "haowv4",
    baseUrl: process.env.HAOW_V4_URL || "http://10.148.0.2:8030/v1",
    apiKeyEnv: "HAOW_V4_KEY",
    defaultModel: process.env.HAOW_V4_MODEL || "haow-v4-multilingual",
    tokenParam: "max_tokens",
  },
};

const anthropic = new AnthropicProvider();
const providers: Record<string, LlmProvider> = {
  anthropic,
  openai: new OpenAICompatProvider(COMPAT.openai),
  xai: new OpenAICompatProvider(COMPAT.xai),
  google: new OpenAICompatProvider(COMPAT.google),
  minimax: new OpenAICompatProvider(COMPAT.minimax),
  humain: new OpenAICompatProvider(COMPAT.humain),
  haowv4: new OpenAICompatProvider(COMPAT.haowv4),
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
  hidden?: boolean; // present in the catalog (resolvable/usable) but NOT shown in the picker
};

export const MODELS: ModelEntry[] = [
  { id: "claude-opus-4-8", label: "Claude Opus 4.8", provider: "anthropic", model: process.env.ANTHROPIC_MODEL || "claude-opus-4-8", family: "Claude" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "anthropic", model: process.env.ANTHROPIC_FAST_MODEL || "claude-haiku-4-5-20251001", fast: true, family: "Claude" },
  { id: "gpt-5.5", label: process.env.OPENAI_LABEL || "GPT-5.5", provider: "openai", model: COMPAT.openai.defaultModel, family: "OpenAI" },
  { id: "grok-4", label: process.env.XAI_LABEL || "Grok 4", provider: "xai", model: COMPAT.xai.defaultModel, family: "Grok" },
  { id: "gemini-2.5-pro", label: process.env.GOOGLE_LABEL || "Gemini 2.5 Pro", provider: "google", model: COMPAT.google.defaultModel, family: "Gemini" },
  { id: "minimax-m2", label: process.env.MINIMAX_LABEL || "MiniMax M2", provider: "minimax", model: process.env.MINIMAX_MODEL || "MiniMax-M2", family: "MiniMax" },
  { id: "minimax-m3", label: process.env.MINIMAX_V3_LABEL || "MiniMax M3", provider: "minimax", model: process.env.MINIMAX_MODEL_V3 || "MiniMax-M3", family: "MiniMax" },
  { id: "humain-gateway", label: process.env.HUMAIN_GATEWAY_LABEL || "HUMAIN Gateway (sovereign)", provider: "humain", model: COMPAT.humain.defaultModel, family: "HUMAIN" },
  // The sovereign default: our own haow-v4, served in-perimeter. Listed
  // first in the picker and used unless an editor picks something else.
  { id: "haow-v4", label: "HAOW-v4 (sovereign)", provider: "haowv4", model: COMPAT.haowv4.defaultModel, family: "HAOW" },
];

export const DEFAULT_MODEL_ID = "haow-v4";

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

// ---- Provider health tracking --------------------------------------------
// `configured` only means an API key is present — NOT that the provider is
// actually reachable/answering. We track REAL reachability so the model picker
// can tell the truth (MC-ISS-01: previously every provider showed configured:true
// while only the fallback was alive, and all generation silently came from it).
// Health is learned two ways: PASSIVELY from every real completion (success →
// healthy, availability error → unhealthy) and ACTIVELY via a cheap cached probe.
type Health = { healthy: boolean; at: number; error?: string };
const healthCache = new Map<string, Health>();

export function recordHealth(name: string, healthy: boolean, error?: string) {
  healthCache.set(name, { healthy, at: Date.now(), error: healthy ? undefined : error });
}
export function getHealth(name: string): Health | null {
  return healthCache.get(name) ?? null;
}

const PROBE_TTL_MS = Number(process.env.MODEL_PROBE_TTL_MS || 60_000);
let lastProbeAt = 0;
let probeInflight: Promise<void> | null = null;

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("probe timeout")), ms)),
  ]);
}

// Actively ping every CONFIGURED provider with a 1-token completion, in parallel,
// updating the health cache. Result is cached for PROBE_TTL_MS so calling /models
// stays cheap. Only probes providers that have a key set.
export async function probeProviders(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastProbeAt < PROBE_TTL_MS) return;
  if (probeInflight) return probeInflight;
  lastProbeAt = now;
  const names = Object.keys(providers).filter((n) => providers[n]?.configured);
  probeInflight = Promise.all(
    names.map(async (name) => {
      try {
        await withTimeout(
          providers[name].complete({ messages: [{ role: "user", content: "ping" }], maxTokens: 1 }),
          Number(process.env.MODEL_PROBE_TIMEOUT_MS || 6000),
        );
        recordHealth(name, true);
      } catch (e: any) {
        recordHealth(name, false, String(e?.error?.error?.message || e?.message || e).slice(0, 200));
      }
    }),
  ).then(() => { probeInflight = null; });
  return probeInflight;
}

// The provider that will ACTUALLY answer a default request: the first provider in
// [primary, ...fallback] that is configured and not known-unhealthy.
export function effectiveProvider(primary = process.env.LLM_PROVIDER || "anthropic"): string | null {
  const ordered = [primary, ...FALLBACK_ORDER].filter((n, i, a) => a.indexOf(n) === i);
  const configured = ordered.filter((n) => providers[n]?.configured);
  const healthy = configured.find((n) => getHealth(n)?.healthy !== false);
  return healthy || configured[0] || null;
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
      recordHealth(name, true);
      return { text, provider: name, model: name === primary ? req.model : undefined, fellBack: name !== primary, tried };
    } catch (e) {
      lastErr = e;
      if (!isAvailabilityError(e)) throw e; // genuine error → don't waste fallbacks
      recordHealth(name, false, String((e as any)?.message || e).slice(0, 200));
      // else: availability error → try the next configured provider
    }
  }
  throw lastErr || new Error("no_provider_available");
}

// Streaming variant: emits onDelta(text) per token from the first configured
// provider that supports streaming (falls back to a single-shot delta if not).
export async function completeStreamWithFallback(
  req: CompleteRequest,
  onDelta: (t: string) => void,
  opts?: { primary?: string; exclude?: string[] },
): Promise<FallbackResult> {
  const primary = opts?.primary || process.env.LLM_PROVIDER || "anthropic";
  const exclude = new Set(opts?.exclude || []);
  const ordered = [primary, ...FALLBACK_ORDER].filter((n, i, a) => a.indexOf(n) === i && !exclude.has(n));
  const list = ordered.filter((n) => providers[n]?.configured);
  const candidates = list.length ? list : [primary];
  const tried: string[] = [];
  let lastErr: any;
  for (const name of candidates) {
    const p = providers[name];
    if (!p) continue;
    tried.push(name);
    const model = name === primary ? req.model : undefined;
    try {
      if (p.completeStream) {
        const text = await p.completeStream({ ...req, model }, onDelta);
        recordHealth(name, true);
        return { text, provider: name, model, fellBack: name !== primary, tried };
      }
      const text = await p.complete({ ...req, model });
      recordHealth(name, true);
      onDelta(text);
      return { text, provider: name, model, fellBack: name !== primary, tried };
    } catch (e) {
      lastErr = e;
      if (!isAvailabilityError(e)) throw e;
      recordHealth(name, false, String((e as any)?.message || e).slice(0, 200));
    }
  }
  throw lastErr || new Error("no_provider_available");
}

// Catalog with live "configured" AND real "healthy" status for the UI. Hidden
// entries (e.g. the test-only haow-v4) are excluded from the picker.
//  - configured: API key present
//  - healthy: last probe/usage actually reached the provider (null = unknown yet)
// So the picker can distinguish "key set but provider down" from "ready".
export function listModels() {
  return MODELS.filter((m) => !m.hidden).map((m) => {
    const configured = Boolean(providers[m.provider]?.configured);
    const h = getHealth(m.provider);
    return {
      id: m.id,
      label: m.label,
      family: m.family,
      provider: m.provider,
      fast: Boolean(m.fast),
      configured,
      healthy: configured ? (h ? h.healthy : null) : false,
      healthError: h && !h.healthy ? h.error : undefined,
    };
  });
}

// Full catalog + which provider will actually answer, and whether the default
// model is degraded (its provider is down so requests silently fall back).
export function catalogHealth() {
  const models = listModels();
  const eff = effectiveProvider();
  const defaultEntry = modelById(DEFAULT_MODEL_ID);
  const defaultHealthy = getHealth(defaultEntry.provider)?.healthy;
  return {
    models,
    effectiveProvider: eff,
    effectiveModel: models.find((m) => m.provider === eff)?.id ?? null,
    degraded: eff !== defaultEntry.provider || defaultHealthy === false,
    defaultModelId: DEFAULT_MODEL_ID,
  };
}
