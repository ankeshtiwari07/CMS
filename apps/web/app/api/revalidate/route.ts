import { revalidateTag } from "next/cache";
import crypto from "node:crypto";

// HMAC-verified on-demand revalidation webhook (called by the CMS event hook).
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature") ?? "";
  const expected = crypto
    .createHmac("sha256", process.env.WEBHOOK_HMAC_SECRET || "dev")
    .update(raw)
    .digest("hex");
  // constant-time comparison
  const ok =
    sig.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!ok) return new Response("invalid signature", { status: 401 });
  const { payload } = JSON.parse(raw);
  // Next 16: revalidateTag(tag, profile)
  if (payload?.collection === "pages") revalidateTag(`page:${payload.slug ?? ""}`, "max");
  return Response.json({ revalidated: true });
}
