import { revalidateTag } from "next/cache";
import crypto from "node:crypto";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature") ?? "";
  const expected = crypto.createHmac("sha256", process.env.WEBHOOK_HMAC_SECRET || "dev").update(raw).digest("hex");
  if (sig !== expected) return new Response("invalid signature", { status: 401 });
  const { payload } = JSON.parse(raw);
  if (payload?.collection === "pages") revalidateTag(`page:${payload.slug ?? ""}`);
  return Response.json({ revalidated: true });
}
