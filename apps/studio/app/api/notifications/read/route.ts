import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser } from "@/lib/payload";

// Mark all notifications read by stamping the user's read time = now.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const res = await payloadFetch(`/api/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ notificationsReadAt: new Date().toISOString() }),
    });
    return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 400 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
