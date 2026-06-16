import type { Access, FieldAccess, Where } from "payload";

// Roles: `admin` is the unrestricted platform administrator. `siteAdmin` has
// admin-level content powers (create/edit/publish/review) but is SITE-SCOPED to
// its `sites` and cannot manage users, roles or global settings. The remaining
// editor roles (author/reviewer/publisher/brand) are also site-scoped by `sites`.
export type Role = "viewer" | "author" | "reviewer" | "publisher" | "brand" | "siteAdmin" | "admin";

// Editor roles that are constrained by the `sites` attribute (siteAdmin included).
const SCOPED_EDITORS: Role[] = ["author", "reviewer", "publisher", "brand", "siteAdmin"];

export const hasRole = (user: any, roles: Role[]): boolean =>
  Boolean(user?.roles?.some((r: Role) => roles.includes(r)));

const siteIds = (user: any): (string | number)[] =>
  (user?.sites ?? []).map((s: any) => (typeof s === "object" ? s.id : s)).filter(Boolean);

/* ------------------------------------------------------------------ *
 * RBAC                                                                *
 * ------------------------------------------------------------------ */
// Platform administrator (global, unrestricted). siteAdmin is NOT a platform admin.
export const isAdmin: Access = ({ req: { user } }) => hasRole(user, ["admin"]);

export const isEditor: Access = ({ req: { user } }) =>
  hasRole(user, ["author", "reviewer", "publisher", "brand", "siteAdmin", "admin"]);

// Publish gate: publishers, site-admins (within scope) and platform admins.
export const canPublish: Access = ({ req: { user } }) => hasRole(user, ["publisher", "siteAdmin", "admin"]);

// Admins manage anyone; a signed-in user may read/update only their own record.
export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (hasRole(user, ["admin"])) return true;
  if (user) return { id: { equals: user.id } };
  return false;
};

/* ------------------------------------------------------------------ *
 * ABAC — attribute-based, layered on top of the role gate.            *
 * Site scope: a scoped editor (incl. siteAdmin) with `sites` set may   *
 * only touch content whose `site` is in their set. No sites = all.     *
 * Platform admins are unrestricted.                                    *
 * ------------------------------------------------------------------ */
export const readPublishedOrEditor: Access = ({ req: { user } }) => {
  if (hasRole(user, ["admin"])) return true;
  if (hasRole(user, SCOPED_EDITORS)) {
    const sites = siteIds(user);
    return sites.length ? ({ site: { in: sites } } as Where) : true;
  }
  return { _status: { equals: "published" } } as Where;
};

// create/update/delete on content: must be an editor; site-scoped by attribute.
export const editorSiteScoped: Access = ({ req: { user } }) => {
  if (hasRole(user, ["admin"])) return true;
  if (!hasRole(user, SCOPED_EDITORS)) return false;
  const sites = siteIds(user);
  return sites.length ? ({ site: { in: sites } } as Where) : true;
};

// Collection-level ABAC by department (e.g. HR owns Careers). Admins always pass.
export const departmentOnly =
  (...depts: string[]): Access =>
  ({ req: { user } }) =>
    hasRole(user, ["admin"]) || (isEditorRole(user) && depts.includes((user as any)?.department));

const isEditorRole = (user: any) => hasRole(user, SCOPED_EDITORS);

/* ------------------------------------------------------------------ *
 * Field-level                                                         *
 * ------------------------------------------------------------------ */
export const brandOnly: FieldAccess = ({ req: { user } }) => hasRole(user, ["brand", "admin"]);

export const canReview: FieldAccess = ({ req: { user } }) =>
  hasRole(user, ["reviewer", "publisher", "siteAdmin", "admin"]);

// Sensitive user fields (roles, scope) — only platform admins may write
// (prevents a siteAdmin from escalating privileges).
export const adminOnlyField: FieldAccess = ({ req: { user } }) => hasRole(user, ["admin"]);
