// Signed outbound webhooks — CMS publish/approval events pushed to HUMAIN Create.
// Best-effort here; a durable outbox/queue is the production hardening (see k8s workers).
import { HUMAIN, hmac } from "./humain";

export type CmsEvent = {
  type: "content.published" | "content.approved" | "content.submitted" | "generation.ingested";
  tenant?: string;
  collection?: string;
  id?: string | number;
  at: string;
  data?: Record<string, unknown>;
};

export async function emitEvent(ev: CmsEvent): Promise<void> {
  if (!HUMAIN.emitUrl) return;
  const body = JSON.stringify(ev);
  try {
    await fetch(HUMAIN.emitUrl, {
      method: "POST",
      headers: { "content-type": "application/json", "x-humain-signature": hmac(body), "x-humain-event": ev.type },
      body,
      signal: AbortSignal.timeout(5000),
    });
  } catch { /* non-blocking */ }
}
