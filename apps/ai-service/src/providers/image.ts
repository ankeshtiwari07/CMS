// Text-to-image render via Replicate (reuses the same token as video). Renders a
// real image when the Replicate key is set; reports configured:false otherwise.
// Never throws — always returns a status object.
const KEY = process.env.IMAGE_API_KEY || process.env.VIDEO_API_KEY || "";
const BASE = process.env.REPLICATE_BASE_URL || "https://api.replicate.com/v1";
const MODEL = process.env.IMAGE_MODEL || "black-forest-labs/flux-schnell";

// MiniMax image generation (image-01) — the sovereign default when a MiniMax key
// is present; Replicate is the fallback. (MiniMax must have balance; if it errors
// — e.g. insufficient balance — we transparently fall back to Replicate.)
const MM_KEY = process.env.MINIMAX_API_KEY || "";
const MM_BASE = process.env.MINIMAX_BASE_URL || "https://api.minimax.io/v1";
const MM_MODEL = process.env.MINIMAX_IMAGE_MODEL || "image-01";
const REPLICATE_OK = Boolean(KEY) && MODEL.includes("/");

export const imageConfigured = Boolean(MM_KEY) || REPLICATE_OK;

export type ImageStatus = {
  configured: boolean;
  status: "unconfigured" | "processing" | "succeeded" | "failed";
  id?: string;
  url?: string;
  message?: string;
};

const unconfigured: ImageStatus = {
  configured: false,
  status: "unconfigured",
  message: "Image rendering is not configured. Set IMAGE_API_KEY (or VIDEO_API_KEY) + a Replicate IMAGE_MODEL on the ai-service.",
};

const pickUrl = (d: any): string | undefined =>
  (Array.isArray(d?.output) ? d.output[0] : undefined) ||
  (typeof d?.output === "string" ? d.output : undefined) ||
  (d?.output && typeof d.output === "object" ? Object.values(d.output).find((v) => typeof v === "string") as string : undefined);
const DONE = ["completed", "succeeded", "success", "done"];
const FAIL = ["failed", "error", "canceled", "cancelled"];

const VALID_AR = new Set(["1:1", "16:9", "21:9", "3:2", "2:3", "4:5", "5:4", "3:4", "4:3", "9:16", "9:21"]);
const AR_ALIAS: Record<string, string> = {
  auto: "1:1", square: "1:1", portrait: "4:5", landscape: "16:9", wide: "16:9",
  story: "9:16", vertical: "9:16", horizontal: "16:9", banner: "21:9",
};
function normalizeAspect(ratio?: string): string | undefined {
  if (!ratio) return undefined;
  const r = ratio.trim().toLowerCase();
  if (VALID_AR.has(r)) return r;
  return AR_ALIAS[r]; // undefined for unknown -> omit (flux defaults to 1:1)
}

// MiniMax image-01 — synchronous (returns a URL directly, no polling).
async function minimaxImage(prompt: string, ratio?: string): Promise<{ url?: string; error?: string }> {
  try {
    const res = await fetch(`${MM_BASE}/image_generation`, {
      method: "POST",
      headers: { Authorization: `Bearer ${MM_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ model: MM_MODEL, prompt, aspect_ratio: normalizeAspect(ratio) || "1:1", response_format: "url", n: 1, prompt_optimizer: true }),
    });
    const j: any = await res.json().catch(() => ({}));
    const code = j?.base_resp?.status_code;
    if (code && code !== 0) return { error: j?.base_resp?.status_msg || `minimax ${code}` };
    const url = j?.data?.image_urls?.[0] || (Array.isArray(j?.data) ? j.data[0]?.url : undefined);
    return url ? { url } : { error: "minimax: no image url" };
  } catch (e: any) {
    return { error: e?.message || "minimax request failed" };
  }
}

export async function startImageRender(prompt: string, ratio?: string): Promise<ImageStatus> {
  if (!imageConfigured) return unconfigured;
  // Prefer MiniMax (sovereign); fall back to Replicate on any MiniMax failure.
  if (MM_KEY) {
    const m = await minimaxImage(prompt, ratio);
    if (m.url) return { configured: true, status: "succeeded", url: m.url };
    if (!REPLICATE_OK) return { configured: true, status: "failed", message: m.error || "image render failed" };
    // else: MiniMax failed but Replicate is available → fall through
  }
  try {
    const input: Record<string, unknown> = { prompt };
    // flux's aspect_ratio only accepts a fixed enum — map studio ratios/aliases
    // (incl. "auto") to a valid value, else omit it (flux defaults to 1:1).
    const ar = normalizeAspect(ratio);
    if (ar) input.aspect_ratio = ar;
    const res = await fetch(`${BASE}/models/${MODEL}/predictions`, {
      method: "POST",
      headers: { Authorization: `Token ${KEY}`, "content-type": "application/json", Prefer: "respond-async" },
      body: JSON.stringify({ input }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) return { configured: true, status: "failed", message: data?.detail || `render error ${res.status}` };
    const url = pickUrl(data);
    if (url) return { configured: true, status: "succeeded", id: data.id, url };
    return { configured: true, status: "processing", id: data.id };
  } catch (e: any) {
    return { configured: true, status: "failed", message: e?.message || "render failed" };
  }
}

export async function pollImageRender(id: string): Promise<ImageStatus> {
  if (!imageConfigured) return unconfigured;
  try {
    const res = await fetch(`${BASE}/predictions/${id}`, { headers: { Authorization: `Token ${KEY}` } });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) return { configured: true, status: "failed", id, message: data?.detail || `poll error ${res.status}` };
    const state = (data?.status || "").toString().toLowerCase();
    const url = pickUrl(data);
    if (DONE.includes(state) || (url && !FAIL.includes(state))) return { configured: true, status: "succeeded", id, url };
    if (FAIL.includes(state)) return { configured: true, status: "failed", id, message: data?.error || "render failed" };
    return { configured: true, status: "processing", id };
  } catch (e: any) {
    return { configured: true, status: "failed", id, message: e?.message || "poll failed" };
  }
}
