// HUMAIN Create integration layer — service-to-service contracts.
// Auth: bearer integration token OR HMAC-signed body (x-humain-signature).
// Tenancy: x-tenant-id header (multi-tenant). Model routing: HUMAIN custom gateway.
import crypto from "crypto";
import { CMS_URL } from "@/lib/env";

export const HUMAIN = {
  webhookSecret: process.env.HUMAIN_WEBHOOK_SECRET || "",
  integrationToken: process.env.HUMAIN_INTEGRATION_TOKEN || "",
  gatewayUrl: process.env.HUMAIN_GATEWAY_URL || "",
  emitUrl: process.env.HUMAIN_EMIT_URL || "", // where the CMS pushes publish events
  defaultTenant: process.env.HUMAIN_DEFAULT_TENANT || "default",
  svcEmail: process.env.HUMAIN_SVC_EMAIL || "admin@humain.sa",
  svcPassword: process.env.HUMAIN_SVC_PASSWORD || process.env.SEED_ADMIN_PASSWORD || "",
};

export function hmac(payload: string, secret = HUMAIN.webhookSecret): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");
}
export function verifyHmac(payload: string, sig: string | null, secret = HUMAIN.webhookSecret): boolean {
  if (!sig || !secret) return false;
  const expected = hmac(payload, secret);
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig)); } catch { return false; }
}

// Service-to-service authorization: a bearer integration token, or an HMAC-signed body.
export function authorizeService(req: Request, rawBody?: string): boolean {
  const auth = req.headers.get("authorization") || "";
  if (HUMAIN.integrationToken && auth === `Bearer ${HUMAIN.integrationToken}`) return true;
  if (rawBody != null) return verifyHmac(rawBody, req.headers.get("x-humain-signature"));
  return false;
}

export function tenantOf(req: Request): string {
  return req.headers.get("x-tenant-id") || HUMAIN.defaultTenant;
}

// Cached service token so integration routes can act against Payload without a browser session.
let _tok: { v: string; exp: number } | null = null;
export async function serviceToken(): Promise<string | null> {
  if (_tok && _tok.exp > Date.now() + 30_000) return _tok.v;
  if (!HUMAIN.svcPassword) return null;
  try {
    const r = await fetch(`${CMS_URL}/api/users/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: HUMAIN.svcEmail, password: HUMAIN.svcPassword }) });
    const j = (await r.json()) as any;
    if (!j?.token) return null;
    _tok = { v: j.token, exp: Date.now() + 6 * 60 * 60 * 1000 };
    return j.token;
  } catch { return null; }
}
// Payload fetch authenticated as the integration service user.
export async function serviceFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const t = await serviceToken();
  const headers: Record<string, string> = { "content-type": "application/json", ...(init.headers as any) };
  if (t) headers.Authorization = `JWT ${t}`;
  return fetch(`${CMS_URL}${path}`, { ...init, headers });
}
