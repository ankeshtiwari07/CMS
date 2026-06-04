import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser } from "@/lib/payload";

export async function GET() {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const res = await payloadFetch("/api/sites?limit=100&depth=0");
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ sites: [] });
  return NextResponse.json({ sites: (data.docs ?? []).map((s: any) => ({ id: s.id, name: s.name })) });
}
