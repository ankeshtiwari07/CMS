// Pluggable text-to-video render provider. Supports Luma (Dream Machine) and
// Replicate. Renders real MP4s when VIDEO_API_KEY is set, and reports
// `configured:false` (so the UI shows the concept + "add key" state) when it
// isn't. Never throws to the caller — always returns a status object.

const KEY = process.env.VIDEO_API_KEY || "";
const PROVIDER = (process.env.VIDEO_PROVIDER || "luma").toLowerCase();
const BASE =
  process.env.VIDEO_BASE_URL ||
  (PROVIDER === "luma" ? "https://api.lumalabs.ai/dream-machine/v1" : "https://api.replicate.com/v1");
// Luma: model name (e.g. ray-2 / ray-flash-2). Replicate: a model version hash.
const MODEL = process.env.VIDEO_MODEL || "ray-2";
const MODEL_VERSION = process.env.VIDEO_MODEL_VERSION || "";

// Luma needs only a key; Replicate also needs a model version.
export const videoConfigured =
  Boolean(KEY) && (PROVIDER === "luma" ? true : Boolean(MODEL_VERSION));

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

// Start a render job. Returns a job id to poll, or an unconfigured status.
export async function startRender(prompt: string): Promise<RenderStatus> {
  if (!videoConfigured) return unconfigured;
  try {
    if (PROVIDER === "luma") {
      const res = await fetch(`${BASE}/generations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ prompt, model: MODEL }),
      });
      const data: any = await res.json();
      if (!res.ok) return { configured: true, status: "failed", provider: PROVIDER, message: data?.detail || data?.message || `render error ${res.status}` };
      return { configured: true, status: "processing", id: data.id, provider: PROVIDER };
    }
    if (PROVIDER === "replicate") {
      const res = await fetch(`${BASE}/predictions`, {
        method: "POST",
        headers: { Authorization: `Token ${KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ version: MODEL_VERSION, input: { prompt } }),
      });
      const data: any = await res.json();
      if (!res.ok) return { configured: true, status: "failed", provider: PROVIDER, message: data?.detail || `render error ${res.status}` };
      return { configured: true, status: "processing", id: data.id, provider: PROVIDER };
    }
    return { configured: true, status: "failed", provider: PROVIDER, message: `Unknown VIDEO_PROVIDER: ${PROVIDER}` };
  } catch (e: any) {
    return { configured: true, status: "failed", provider: PROVIDER, message: e?.message || "render failed" };
  }
}

// Poll a render job by id.
export async function pollRender(id: string): Promise<RenderStatus> {
  if (!videoConfigured) return unconfigured;
  try {
    if (PROVIDER === "luma") {
      const res = await fetch(`${BASE}/generations/${id}`, {
        headers: { Authorization: `Bearer ${KEY}`, accept: "application/json" },
      });
      const data: any = await res.json();
      if (!res.ok) return { configured: true, status: "failed", id, provider: PROVIDER, message: data?.detail || `poll error ${res.status}` };
      const state = data.state; // queued | dreaming | completed | failed
      if (state === "completed") return { configured: true, status: "succeeded", id, url: data?.assets?.video, provider: PROVIDER };
      if (state === "failed") return { configured: true, status: "failed", id, provider: PROVIDER, message: data?.failure_reason || "render failed" };
      return { configured: true, status: "processing", id, provider: PROVIDER };
    }
    if (PROVIDER === "replicate") {
      const res = await fetch(`${BASE}/predictions/${id}`, { headers: { Authorization: `Token ${KEY}` } });
      const data: any = await res.json();
      if (!res.ok) return { configured: true, status: "failed", id, provider: PROVIDER, message: data?.detail || `poll error ${res.status}` };
      if (data.status === "succeeded") {
        const url = Array.isArray(data.output) ? data.output[data.output.length - 1] : data.output;
        return { configured: true, status: "succeeded", id, url, provider: PROVIDER };
      }
      if (data.status === "failed" || data.status === "canceled") {
        return { configured: true, status: "failed", id, provider: PROVIDER, message: data?.error || "render failed" };
      }
      return { configured: true, status: "processing", id, provider: PROVIDER };
    }
    return { configured: true, status: "failed", id, provider: PROVIDER, message: `Unknown VIDEO_PROVIDER: ${PROVIDER}` };
  } catch (e: any) {
    return { configured: true, status: "failed", id, provider: PROVIDER, message: e?.message || "poll failed" };
  }
}
