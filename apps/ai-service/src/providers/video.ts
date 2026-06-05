// Pluggable text-to-video render provider. Supports Luma Agents API
// (agents.lumalabs.ai/v1 — the key the user has), Luma Dream Machine, and
// Replicate. Renders real MP4s when VIDEO_API_KEY is set; reports
// `configured:false` otherwise. Never throws — always returns a status object.

const KEY = process.env.VIDEO_API_KEY || "";
const PROVIDER = (process.env.VIDEO_PROVIDER || "luma-agents").toLowerCase();
const DEFAULT_BASE: Record<string, string> = {
  "luma-agents": "https://agents.lumalabs.ai/v1",
  luma: "https://api.lumalabs.ai/dream-machine/v1",
  replicate: "https://api.replicate.com/v1",
};
const BASE = process.env.VIDEO_BASE_URL || DEFAULT_BASE[PROVIDER] || DEFAULT_BASE["luma-agents"];
// Agents/Luma: a model name (uni-1 / ray-2). Replicate: a model version hash.
const MODEL = process.env.VIDEO_MODEL || "uni-1";
const MODEL_VERSION = process.env.VIDEO_MODEL_VERSION || "";

// Replicate needs either an official model (owner/name in VIDEO_MODEL) or a
// community version hash (VIDEO_MODEL_VERSION); the others only need the key.
export const videoConfigured =
  Boolean(KEY) && (PROVIDER === "replicate" ? Boolean(MODEL_VERSION) || MODEL.includes("/") : true);

export type RenderStatus = {
  configured: boolean;
  status: "unconfigured" | "processing" | "succeeded" | "failed";
  id?: string;
  url?: string;
  provider?: string;
  message?: string;
};

const unconfigured: RenderStatus = {
  configured: false,
  status: "unconfigured",
  provider: PROVIDER,
  message:
    "Video rendering is not configured. Set VIDEO_API_KEY (and VIDEO_PROVIDER) on the ai-service to enable " +
    "real MP4 rendering. The concept/script above is ready to use.",
};

// Defensive field extraction (the Agents API shape varies across models).
const pickId = (d: any) => d?.id || d?.generation_id || d?.data?.id || d?.generation?.id;
const pickState = (d: any) => (d?.state || d?.status || d?.data?.state || "").toString().toLowerCase();
const pickUrl = (d: any) =>
  d?.assets?.video || d?.output?.video || d?.video_url || d?.url || d?.data?.url ||
  (Array.isArray(d?.output) ? d.output[d.output.length - 1] : undefined) ||
  (d?.assets && typeof d.assets === "object" ? Object.values(d.assets)[0] : undefined);
const DONE = ["completed", "succeeded", "success", "done", "finished"];
const FAIL = ["failed", "error", "canceled", "cancelled"];

export async function startRender(prompt: string): Promise<RenderStatus> {
  if (!videoConfigured) return unconfigured;
  try {
    if (PROVIDER === "luma-agents") {
      const res = await fetch(`${BASE}/generations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ prompt, model: MODEL, type: "video", output_format: "mp4" }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) return { configured: true, status: "failed", provider: PROVIDER, message: data?.detail || data?.message || `render error ${res.status}` };
      const id = pickId(data);
      const url = pickUrl(data);
      if (url) return { configured: true, status: "succeeded", id, url, provider: PROVIDER }; // sync response
      return { configured: true, status: "processing", id, provider: PROVIDER };
    }
    if (PROVIDER === "luma") {
      const res = await fetch(`${BASE}/generations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ prompt, model: MODEL }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) return { configured: true, status: "failed", provider: PROVIDER, message: data?.detail || data?.message || `render error ${res.status}` };
      return { configured: true, status: "processing", id: pickId(data), provider: PROVIDER };
    }
    if (PROVIDER === "replicate") {
      // Official model (owner/name) -> /v1/models/{model}/predictions (no version).
      // Community model -> /v1/predictions with a {version} hash.
      const official = MODEL.includes("/") && !MODEL_VERSION;
      const url = official ? `${BASE}/models/${MODEL}/predictions` : `${BASE}/predictions`;
      const body = official ? { input: { prompt } } : { version: MODEL_VERSION, input: { prompt } };
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Token ${KEY}`, "content-type": "application/json", Prefer: "respond-async" },
        body: JSON.stringify(body),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) return { configured: true, status: "failed", provider: PROVIDER, message: data?.detail || `render error ${res.status}` };
      return { configured: true, status: "processing", id: data.id, provider: PROVIDER };
    }
    return { configured: true, status: "failed", provider: PROVIDER, message: `Unknown VIDEO_PROVIDER: ${PROVIDER}` };
  } catch (e: any) {
    return { configured: true, status: "failed", provider: PROVIDER, message: e?.message || "render failed" };
  }
}

export async function pollRender(id: string): Promise<RenderStatus> {
  if (!videoConfigured) return unconfigured;
  try {
    const replicate = PROVIDER === "replicate";
    const path = replicate ? `${BASE}/predictions/${id}` : `${BASE}/generations/${id}`;
    const headers: Record<string, string> = replicate
      ? { Authorization: `Token ${KEY}` }
      : { Authorization: `Bearer ${KEY}`, accept: "application/json" };
    const res = await fetch(path, { headers });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) return { configured: true, status: "failed", id, provider: PROVIDER, message: data?.detail || `poll error ${res.status}` };
    const state = pickState(data);
    const url = pickUrl(data);
    if (DONE.includes(state) || (url && !FAIL.includes(state))) return { configured: true, status: "succeeded", id, url, provider: PROVIDER };
    if (FAIL.includes(state)) return { configured: true, status: "failed", id, provider: PROVIDER, message: data?.failure_reason || data?.error || "render failed" };
    return { configured: true, status: "processing", id, provider: PROVIDER };
  } catch (e: any) {
    return { configured: true, status: "failed", id, provider: PROVIDER, message: e?.message || "poll failed" };
  }
}
