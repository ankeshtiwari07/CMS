// Component library API for the in-CMS Component Studio. GET lists components
// (editors see all; the builder needs drafts too); POST creates a building block.
// Editors (and the delegated Component Agent) may create components as DRAFTS;
// the collection's status→live gate ensures only publish authorities can put one
// live, and only after approval (Flow B).
import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser, hasRole } from "@/lib/payload";

export async function GET() {
  const res = await payloadFetch("/api/components?limit=200&depth=0&sort=-updatedAt");
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!hasRole(user, ["author", "reviewer", "publisher", "brand", "siteAdmin", "admin"])) {
    return NextResponse.json({ error: "Editors only" }, { status: 403 });
  }
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const res = await payloadFetch("/api/components", { method: "POST", body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
