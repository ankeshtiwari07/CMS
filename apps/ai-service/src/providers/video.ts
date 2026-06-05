// Pluggable text-to-video render provider. Default target is Replicate (hosts
// hosted video models like Luma/Kling/SVD); any provider with a create+poll
// REST shape can be added. Renders real MP4s when VIDEO_API_KEY is set, and
// reports `configured:false` (so the UI shows the concept + "add key" state)
// when it isn't. Never throws to the caller — returns a status object.

const KEY = process.env.VIDEO_API_KEY || "";
const PROVIDER = process.env.VIDEO_PROVIDER || "replicate";
const BASE = process.env.VIDEO_BASE_URL || "https://api.replicate.com/v1";
// A Replicate model version hash (or owner/name for official models).
const MODEL_VERSION = process.env.VIDEO_MODEL_VERSION || "";

export const videoConfigured = Boolean(KEY) && Boolean(MODEL_VERSION);

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
    "Video rendering is not configured. Set VIDEO_API_KEY and VIDEO_MODEL_VERSION on the ai-service " +
    "(e.g. a Replicate text-to-video model) to enable real MP4 rendering. The concept/script above is ready to use.",
};

// Start a render job. Returns a job id to poll, or an unconfigured status.
export async function startRender(prompt: string): Promise<RenderStatus> {
  if (!videoConfigured) return unconfigured;
  try {
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
    // Generic OpenAI-style video endpoints could be added here.
    return { configured: true, status: "failed", provider: PROVIDER, message: `Unknown VIDEO_PROVIDER: ${PROVIDER}` };
  } catch (e: any) {
    return { configured: true, status: "failed", provider: PROVIDER, message: e?.message || "render failed" };
  }
}

// Poll a render job by id.
export async function pollRender(id: string): Promise<RenderStatus> {
  if (!videoConfigured) return unconfigured;
  try {
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
