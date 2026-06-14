// Conversational streaming proxy. Forwards Server-Sent Events from the AI
// service's agentic /studio/chat straight to the browser, and — once the stream
// finishes — persists the produced piece as a Project asset (best-effort), the
// same way /api/generate does. Auth token is captured up front because the
// persistence runs after the response has started streaming (outside request scope).
import { AI_URL, CMS_URL } from "@/lib/env";
import { getToken, getCurrentUser } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function deriveTitle(artifact: string, prompt: string): string {
  const text = String(artifact || "");
  if (/^\s*<!doctype|^\s*<html/i.test(text)) {
    const t = text.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
    const clean = (t || "").replace(/<[^>]+>/g, "").trim();
    return (clean || String(prompt || "Website")).slice(0, 80);
  }
  const heading = text.split("\n").map((l) => l.match(/^\s*#{1,3}\s+(.+)$/)?.[1]).find(Boolean);
  if (heading) return heading.replace(/[*_`>#]/g, "").trim().slice(0, 80);
  const firstLine = text
    .split("\n")
    .map((s) => s.replace(/<[^>]+>/g, "").replace(/[*_`>#]/g, "").trim())
    .find((l) => l.length > 8);
  if (firstLine) return firstLine.slice(0, 80);
  return String(prompt || "Untitled").slice(0, 80);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const token = await getToken();

  const body = await req.json();
  const { mode, prompt, options } = body || {};
  if (!prompt) return Response.json({ error: "Prompt is required" }, { status: 400 });

  let upstream: Response;
  try {
    upstream = await fetch(`${AI_URL}/studio/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return Response.json({ error: "generation_unavailable" }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) return Response.json({ error: "generation_failed" }, { status: 502 });

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let artifact = "";
  let modelLabel = "";
  let builtHtml = "";

  const stream = new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.read();
      if (done) {
        if ((artifact && !/^\s*[⚠⚙]/.test(artifact)) || builtHtml) {
          try {
            await fetch(`${CMS_URL}/api/projects`, {
              method: "POST",
              cache: "no-store",
              headers: { "content-type": "application/json", ...(token ? { Authorization: `JWT ${token}` } : {}) },
              body: JSON.stringify({
                title: deriveTitle(builtHtml || artifact, prompt),
                type: builtHtml ? "websiteBuild" : mode && mode !== "auto" ? mode : "writing",
                prompt,
                model: modelLabel || body.model,
                options,
                asset: { text: artifact, ...(builtHtml ? { html: true } : {}) },
                status: "ready",
                owner: user.id,
              }),
            });
          } catch {
            /* non-fatal */
          }
        }
        controller.close();
        return;
      }
      // Parse complete SSE events to capture the final artifact + model label.
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const line = raw.startsWith("data:") ? raw.slice(5).trim() : raw.trim();
        if (!line) continue;
        try {
          const ev = JSON.parse(line);
          if (ev.type === "done") { artifact = ev.artifact || artifact; modelLabel = ev.modelLabel || modelLabel; }
          else if (ev.type === "artifact" && ev.kind === "html") builtHtml = ev.html || builtHtml;
        } catch {
          /* ignore partial */
        }
      }
      controller.enqueue(value); // forward original bytes unchanged
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
