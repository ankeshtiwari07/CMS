import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser } from "@/lib/payload";
import { TABS } from "@/lib/content-types";

// Minimal valid Lexical editor state from plain text (paragraph per blank line).
function toLexical(text: string, dir: "ltr" | "rtl" = "ltr") {
  const paras = (text || "").split(/\n{2,}/).map((p) => p.trim());
  const children = (paras.length ? paras : [""]).map((p) => ({
    type: "paragraph",
    version: 1,
    direction: dir,
    format: "",
    indent: 0,
    textFormat: 0,
    children: p
      ? [{ type: "text", version: 1, text: p, detail: 0, format: 0, mode: "normal", style: "" }]
      : [],
  }));
  return { root: { type: "root", version: 1, direction: dir, format: "", indent: 0, children } };
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug, status, template, locale, data } = await req.json();
  const tab = TABS.find((t) => t.slug === slug);
  if (!tab) return NextResponse.json({ error: "Unknown content type" }, { status: 400 });

  const dir = locale === "ar" ? "rtl" : "ltr";
  const body: Record<string, unknown> = { template };
  for (const f of tab.fields) {
    const v = data?.[f.name];
    if (v === undefined || v === null || v === "") continue;
    body[f.name] = f.type === "richtext" && typeof v === "string" ? toLexical(v, dir) : v;
  }
  body._status = status === "published" ? "published" : "draft";

  const qs = locale ? `?locale=${encodeURIComponent(locale)}` : "";
  const res = await payloadFetch(`/api/${slug}${qs}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const out = await res.json();
  if (!res.ok) {
    const msg = out?.errors?.[0]?.message || out?.message || "Save failed";
    return NextResponse.json({ error: msg, details: out?.errors }, { status: res.status });
  }
  return NextResponse.json({ ok: true, doc: out.doc ?? out });
}
