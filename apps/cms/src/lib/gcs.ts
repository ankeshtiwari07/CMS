// GCS object-storage adapter — uploads via Application Default Credentials from the GCE
// metadata server (no key file, no SDK dependency). Bucket set by GCS_BUCKET; residency
// follows the bucket's region. Falls back to null (local disk) when unconfigured.
let _tok: { v: string; exp: number } | null = null;

async function adcToken(): Promise<string | null> {
  if (_tok && _tok.exp > Date.now() + 30_000) return _tok.v;
  try {
    const r = await fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token", { headers: { "Metadata-Flavor": "Google" } });
    const j = (await r.json()) as any;
    if (!j?.access_token) return null;
    _tok = { v: j.access_token, exp: Date.now() + (j.expires_in ? j.expires_in * 1000 : 3000_000) };
    return j.access_token;
  } catch { return null; }
}

export function gcsConfigured(): boolean {
  return !!process.env.GCS_BUCKET;
}

// Upload a buffer and return its object URL (or null on failure → caller keeps local file).
export async function gcsUpload(name: string, body: Buffer | Uint8Array, contentType?: string): Promise<string | null> {
  const bucket = process.env.GCS_BUCKET;
  if (!bucket) return null;
  const token = await adcToken();
  if (!token) return null;
  try {
    const r = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(name)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": contentType || "application/octet-stream" },
      body: body as any,
    });
    if (!r.ok) return null;
    return `https://storage.googleapis.com/${bucket}/${name.split("/").map(encodeURIComponent).join("/")}`;
  } catch { return null; }
}
