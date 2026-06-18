// Publish an agent-produced content piece into a CMS module — as a DRAFT for
// human review (agents propose, humans dispose). Converts the Markdown body into
// Payload's Lexical rich-text shape and maps to each collection's title/body field.
import { NextResponse } from "next/server";
import { payloadFetch, getCurrentUser } from "@/lib/payload";

// collection → { title field, rich-text field } (or a plain text field if no richText).
const MAP: Record<string, { title: string; rich?: string; text?: string }> = {
  articles: { title: "title", rich: "body" },
  blogPosts: { title: "headline", rich: "solution" },
  pressReleases: { title: "headline", rich: "body" },
  events: { title: "title", rich: "details" },
  caseStudies: { title: "title", rich: "solution" },
  faqs: { title: "question", rich: "answer" },
  products: { title: "name", text: "summary" },
};

const stripInline = (s: string) =>
  s.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();

const textNode = (text: string) => ({ detail: 0, format: 0, mode: "normal", style: "", text, type: "text", version: 1 });
const para = (text: string) => ({ children: text ? [textNode(text)] : [], direction: "ltr", format: "", indent: 0, type: "paragraph", version: 1, textFormat: 0 });
const heading = (text: string, tag: string) => ({ children: [textNode(text)], direction: "ltr", format: "", indent: 0, type: "heading", version: 1, tag });
const listNode = (items: string[], ordered: boolean) => ({
  children: items.map((it, idx) => ({ children: [textNode(it)], direction: "ltr", format: "", indent: 0, type: "listitem", version: 1, value: idx + 1 })),
  direction: "ltr", format: "", indent: 0, type: "list", version: 1, listType: ordered ? "number" : "bullet", start: 1, tag: ordered ? "ol" : "ul",
});

// Minimal, safe Markdown → Lexical (headings, lists, paragraphs; inline markers stripped).
function mdToLexical(md: string) {
  const lines = String(md || "").replace(/\r\n/g, "\n").split("\n");
  const children: any[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { children.push(heading(stripInline(h[2]), "h" + Math.min(h[1].length + 1, 6))); i++; continue; }
    if (/^\s*[-*+]\s+/.test(line)) { const items: string[] = []; while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { items.push(stripInline(lines[i].replace(/^\s*[-*+]\s+/, ""))); i++; } children.push(listNode(items, false)); continue; }
    if (/^\s*\d+\.\s+/.test(line)) { const items: string[] = []; while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { items.push(stripInline(lines[i].replace(/^\s*\d+\.\s+/, ""))); i++; } children.push(listNode(items, true)); continue; }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6})\s/.test(lines[i]) && !/^\s*[-*+]\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i])) { buf.push(lines[i]); i++; }
    children.push(para(stripInline(buf.join(" "))));
  }
  if (!children.length) children.push(para(""));
  return { root: { children, direction: "ltr", format: "", indent: 0, type: "root", version: 1 } };
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { collection, title, bodyMarkdown, category } = await req.json();
  const m = MAP[collection];
  if (!m) return NextResponse.json({ error: `Cannot publish to "${collection}"` }, { status: 400 });

  // Agent output → always a draft, flagged AI-generated so HITL forces a human
  // editorial review before it can ever be published.
  const body: Record<string, unknown> = { [m.title]: title || "Untitled", _status: "draft", workflowState: "draft", aiGenerated: true };
  if (m.rich) body[m.rich] = mdToLexical(bodyMarkdown);
  else if (m.text) body[m.text] = stripInline(String(bodyMarkdown || "").replace(/[#>*_`-]/g, " ")).slice(0, 4000);
  if (collection === "faqs" && category) body.category = category;

  try {
    const res = await payloadFetch(`/api/${collection}`, { method: "POST", body: JSON.stringify(body) });
    const d = await res.json();
    if (!res.ok) {
      const msg = d?.errors?.[0]?.message || d?.message || "publish_failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ ok: true, draft: true, id: d?.doc?.id });
  } catch {
    return NextResponse.json({ error: "publish_unavailable" }, { status: 502 });
  }
}
