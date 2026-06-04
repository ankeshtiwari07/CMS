import type { Access, FieldAccess } from "payload";

export type Role = "viewer" | "author" | "reviewer" | "publisher" | "brand" | "admin";

export const hasRole = (user: any, roles: Role[]): boolean =>
  Boolean(user?.roles?.some((r: Role) => roles.includes(r)));

const siteIds = (user: any): (string | number)[] =>
  (user?.sites ?? []).map((s: any) => (typeof s === "object" ? s.id : s)).filter(Boolean);

/* ------------------------------------------------------------------ *
 * RBAC                                                                *
 * ------------------------------------------------------------------ */
export const isAdmin: Access = ({ req: { user } }) => hasRole(user, ["admin"]);

export const isEditor: Access = ({ req: { user } }) =>
  hasRole(user, ["author", "reviewer", "publisher", "brand", "admin"]);

export const canPublish: Access = ({ req: { user } }) => hasRole(user, ["publisher", "admin"]);

// Admins manage anyone; a signed-in user may read/update only their own record.
export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (hasRole(user, ["admin"])) return true;
  if (user) return { id: { equals: user.id } };
  return false;
};

/* ------------------------------------------------------------------ *
 * ABAC — attribute-based, layered on top of the role gate.            *
 * Site scope: an editor with `sites` set may only touch content whose  *
 * `site` is in their set. No sites set = all sites. Admins unrestricted.*
 * ------------------------------------------------------------------ */
export const readPublishedOrEditor: Access = ({ req: { user } }) => {
  if (hasRole(user, ["admin"])) return true;
  if (hasRole(user, ["author", "reviewer", "publisher", "brand"])) {
    const sites = siteIds(user);
    return sites.length ? { site: { in: sites } } : true;
  }
  return { _status: { equals: "published" } };
};

// create/update/delete on content: must be an editor; site-scoped by attribute.
export const editorSiteScoped: Access = ({ req: { user } }) => {
  if (hasRole(user, ["admin"])) return true;
  if (!hasRole(user, ["author", "reviewer", "publisher", "brand"])) return false;
  const sites = siteIds(user);
  return sites.length ? { site: { in: sites } } : true;
};

// Collection-level ABAC by department (e.g. HR owns Careers). Admins always pass.
export const departmentOnly =
  (...depts: string[]): Access =>
  ({ req: { user } }) =>
    hasRole(user, ["admin"]) || (isEditorRole(user) && depts.includes((user as any)?.department));

const isEditorRole = (user: any) => hasRole(user, ["author", "reviewer", "publisher", "brand"]);

/* ------------------------------------------------------------------ *
 * Field-level                                                         *
 * ------------------------------------------------------------------ */
export const brandOnly: FieldAccess = ({ req: { user } }) => hasRole(user, ["brand", "admin"]);

export const canReview: FieldAccess = ({ req: { user } }) =>
  hasRole(user, ["reviewer", "publisher", "admin"]);

// Sensitive user fields (roles, scope) — only admins may write.
export const adminOnlyField: FieldAccess = ({ req: { user } }) => hasRole(user, ["admin"]);
