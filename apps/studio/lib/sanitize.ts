import "server-only";

// Sensitive keys that must NEVER be serialized to a browser response. These show
// up when Payload depth-expands a `users` relationship (e.g. approvals.decidedBy,
// content.createdBy): the populated user doc carries its auth session list and
// credential material. Leaking `sessions` exposes every live session id + expiry
// of another user (AP-ISS-01 / MC-ISS-02). Strip them defensively at the public
// API boundary regardless of Payload populate/access semantics.
const SENSITIVE_KEYS = new Set([
  "sessions",
  "password",
  "hash",
  "salt",
  "apiKey",
  "enableAPIKey",
  "loginAttempts",
  "lockUntil",
  "resetPasswordToken",
  "resetPasswordExpiration",
  "_verificationToken",
]);

/**
 * Recursively remove sensitive auth fields from any value before it leaves the
 * server. Safe for plain JSON (objects/arrays/scalars). Returns a new structure;
 * does not mutate the input.
 */
export function scrub<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => scrub(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k)) continue;
      out[k] = scrub(v);
    }
    return out as unknown as T;
  }
  return value;
}
