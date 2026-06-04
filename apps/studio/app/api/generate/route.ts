// Studio generation endpoint -> AI service -> persists a Project in the CMS.
export async function POST(req: Request) {
  const { mode, prompt, options } = await req.json();
  const AI = process.env.AI_SERVICE_URL || "http://localhost:4000";
  const CMS = process.env.CMS_BASE_URL || "http://localhost:3001";

  const gen = await fetch(`${AI}/studio/generate`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode, prompt, options }),
  });
  if (!gen.ok) return new Response("generation failed", { status: 502 });
  const { artifact } = await gen.json();

  // Persist as a typed project asset (ready to promote into CMS collections).
  const saved = await fetch(`${CMS}/api/projects`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.STUDIO_SERVICE_TOKEN}` },
    body: JSON.stringify({ title: prompt.slice(0, 60), type: mode, prompt, options, asset: { text: artifact }, status: "ready" }),
  });
  const project = await saved.json();
  return Response.json({ ok: true, project: project?.doc ?? project, artifact });
}
