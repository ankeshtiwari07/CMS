// GET /api/humain/manifest — discovery document describing the CMS module's integration
// surface for HUMAIN Create (endpoints, auth, tenancy, residency, model routing).
import { NextResponse } from "next/server";
import { HUMAIN } from "@/lib/humain";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    service: "aavya-cms",
    module: "CMS",
    version: "1.0",
    integrates_with: "humain-create",
    capabilities: ["brand-context", "generation-ingest", "content-library", "publish-events", "sso"],
    endpoints: {
      generations: "/api/humain/generations",
      brand_context: "/api/humain/brand-context",
      library: "/api/humain/library",
      events: "/api/humain/events",
      sso: "/api/auth/sso",
    },
    auth: { service: "Bearer <integration-token> or HMAC x-humain-signature", user: "OIDC (Azure SSO / Google SSO)" },
    tenancy: { header: "x-tenant-id", multi_tenant: true },
    residency: "ksa",
    model_routing: { via: "humain-custom-model-gateway", sovereign: "minimax", configured: !!HUMAIN.gatewayUrl },
    events_out: { configured: !!HUMAIN.emitUrl, signed: "x-humain-signature (sha256 HMAC)" },
  });
}
