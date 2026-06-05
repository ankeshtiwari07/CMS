import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser } from "@/lib/payload";

const TYPES = ["deck", "image", "website", "email", "brand", "designSystem", "writing", "translation"];

// List the current user's projects.
export async function GET() {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const res = await payloadFetch("/api/projects?sort=-updatedAt&limit=60&depth=0");
  const data = res.ok ? await res.json() : { docs: [] };
  return NextResponse.json({ projects: data.docs ?? [] });
}

// Create a new (blank) project. Generation-backed projects go through /api/generate.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, type, prompt, text } = await req.json();
  if (!title || !String(title).trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  const projType = TYPES.includes(type) ? type : "writing";

  const res = await payloadFetch("/api/projects", {
    method: "POST",
    body: JSON.stringify({
      title: String(title).slice(0, 80),
      type: projType,
      prompt: prompt || "",
      asset: { text: text || "" },
      status: "draft",
      owner: user.id,
    }),
  });
  const out = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: out?.errors?.[0]?.message || "Create failed" }, { status: res.status });
  }
  return NextResponse.json({ ok: true, project: out?.doc ?? out });
}
