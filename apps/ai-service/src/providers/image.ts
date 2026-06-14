// Text-to-image render via Replicate (reuses the same token as video). Renders a
// real image when the Replicate key is set; reports configured:false otherwise.
// Never throws — always returns a status object.
const KEY = process.env.IMAGE_API_KEY || process.env.VIDEO_API_KEY || "";
const BASE = process.env.REPLICATE_BASE_URL || "https://api.replicate.com/v1";
const MODEL = process.env.IMAGE_MODEL || "black-forest-labs/flux-schnell";

export const imageConfigured = Boolean(KEY) && MODEL.includes("/");

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

export async function startImageRender(prompt: string, ratio?: string): Promise<ImageStatus> {
  if (!imageConfigured) return unconfigured;
  try {
    const input: Record<string, unknown> = { prompt };
    if (ratio) input.aspect_ratio = ratio; // flux supports aspect_ratio (e.g. "16:9","1:1")
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
