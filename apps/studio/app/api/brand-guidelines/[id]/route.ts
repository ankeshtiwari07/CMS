import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser } from "@/lib/payload";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const res = await payloadFetch(`/api/brandGuidelines/${id}`, { method: "DELETE" });
  return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 400 });
}
