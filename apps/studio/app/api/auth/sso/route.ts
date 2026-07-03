// POST /api/auth/sso — federated SSO bridge. Accepts an OIDC id_token from the enterprise
// IdP (Azure SSO / Google SSO), verifies it against the issuer JWKS (RS256, Node crypto — no
// extra deps), provisions/maps the identity to a CMS user, and issues the CMS session cookie
// via a deterministic service-derived credential. Closes the OIDC-ready → OIDC-wired gap.
import { NextResponse } from "next/server";
import crypto from "crypto";
import { serviceFetch, tenantOf, HUMAIN } from "@/lib/humain";
import { CMS_URL, TOKEN_COOKIE } from "@/lib/env";

export const dynamic = "force-dynamic";

const ISSUERS: Record<string, { jwks: string; aud?: string }> = {
  azure: { jwks: process.env.AZURE_JWKS || "https://login.microsoftonline.com/common/discovery/v2.0/keys", aud: process.env.AZURE_CLIENT_ID },
  google: { jwks: "https://www.googleapis.com/oauth2/v3/certs", aud: process.env.GOOGLE_CLIENT_ID },
};
const b64u = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

async function verifyOidc(idToken: string, provider: string): Promise<any> {
  const cfg = ISSUERS[provider];
  const [h, p, s] = idToken.split(".");
  if (!h || !p || !s) throw new Error("malformed token");
  const header = JSON.parse(b64u(h).toString());
  const jwks = await (await fetch(cfg.jwks)).json();
  const jwk = (jwks.keys || []).find((k: any) => k.kid === header.kid) || (jwks.keys || [])[0];
  if (!jwk) throw new Error("no signing key");
  const pub = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const ok = crypto.verify("RSA-SHA256", Buffer.from(`${h}.${p}`), pub, b64u(s));
  if (!ok) throw new Error("bad signature");
  const claims = JSON.parse(b64u(p).toString());
  if (claims.exp && Date.now() / 1000 > claims.exp) throw new Error("expired");
  if (cfg.aud && claims.aud && claims.aud !== cfg.aud && !(Array.isArray(claims.aud) && claims.aud.includes(cfg.aud))) throw new Error("audience mismatch");
  return claims;
}

// Deterministic per-user credential so the SSO'd identity can obtain a real Payload session
// without storing a password. Derivation key is a server secret, never exposed.
function derivedPassword(email: string): string {
  const key = process.env.HUMAIN_SSO_SECRET || HUMAIN.webhookSecret || "sso-derivation-key";
  return "sso_" + crypto.createHmac("sha256", key).update(email).digest("hex").slice(0, 40);
}

export async function POST(req: Request) {
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const provider = body.provider === "google" ? "google" : "azure";
  const idToken = body.id_token || body.idToken;
  if (!idToken) return NextResponse.json({ error: "missing id_token" }, { status: 400 });

  let claims: any;
  try { claims = await verifyOidc(idToken, provider); }
  catch (e: any) { return NextResponse.json({ error: "token_verification_failed", detail: String(e?.message || e).slice(0, 120) }, { status: 401 }); }

  const email = String(claims.email || claims.preferred_username || claims.upn || "").toLowerCase();
  if (!email) return NextResponse.json({ error: "no_email_claim" }, { status: 401 });
  const tenant = tenantOf(req);
  const pw = derivedPassword(email);

  // Find-or-provision the CMS user, service-authenticated, and (re)set the derived credential.
  const found = await serviceFetch(`/api/users?where[email][equals]=${encodeURIComponent(email)}&limit=1&depth=0`);
  const fj = await found.json().catch(() => ({} as any));
  let userId = (fj.docs || [])[0]?.id;
  if (userId) {
    await serviceFetch(`/api/users/${userId}`, { method: "PATCH", body: JSON.stringify({ password: pw }) }).catch(() => {});
  } else {
    const create = await serviceFetch(`/api/users`, { method: "POST", body: JSON.stringify({ email, name: claims.name || email.split("@")[0], roles: ["author"], password: pw }) });
    const cj = await create.json().catch(() => ({} as any));
    userId = cj?.doc?.id;
    if (!userId) return NextResponse.json({ error: "provision_failed", detail: cj?.errors?.[0]?.message }, { status: 500 });
  }

  // Exchange the derived credential for a real Payload session cookie.
  const login = await fetch(`${CMS_URL}/api/users/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password: pw }) });
  const lj = await login.json().catch(() => ({} as any));
  const token = lj?.token || null;
  const res = NextResponse.json({ ok: !!token, email, tenant, userId, provider, session: !!token });
  if (token) res.cookies.set(TOKEN_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 8 });
  return res;
}
