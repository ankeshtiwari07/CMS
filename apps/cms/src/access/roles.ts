import type { Access, FieldAccess } from "payload";

export type Role = "viewer" | "author" | "reviewer" | "publisher" | "brand" | "admin";

export const hasRole = (user: any, roles: Role[]): boolean =>
  Boolean(user?.roles?.some((r: Role) => roles.includes(r)));

export const isAdmin: Access = ({ req: { user } }) => hasRole(user, ["admin"]);

export const isEditor: Access = ({ req: { user } }) =>
  hasRole(user, ["author", "reviewer", "publisher", "brand", "admin"]);

// Public can read only published; editors read everything (incl. drafts)
export const readPublishedOrEditor: Access = ({ req: { user } }) => {
  if (hasRole(user, ["author", "reviewer", "publisher", "brand", "admin"])) return true;
  return { _status: { equals: "published" } };
};

export const canPublish: Access = ({ req: { user } }) =>
  hasRole(user, ["publisher", "admin"]);

export const brandOnly: FieldAccess = ({ req: { user } }) =>
  hasRole(user, ["brand", "admin"]);
