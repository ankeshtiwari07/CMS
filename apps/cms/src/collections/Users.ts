import type { CollectionConfig } from "payload";
import { isAdmin, isAdminOrSelf, adminOnlyField } from "../access/roles";

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    // Local auth for break-glass admin; OIDC strategy added in payload.config.ts
    tokenExpiration: 60 * 60 * 8,
    // Brute-force protection: lock an account after 5 failed attempts for 10 min.
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    cookies: { sameSite: "Lax", secure: process.env.NODE_ENV === "production" },
  },
  admin: { useAsTitle: "email", defaultColumns: ["email", "name", "roles", "department", "active"], group: "Access" },
  access: {
    create: isAdmin,
    read: isAdminOrSelf, // admins see all; users can read their own record
    update: isAdminOrSelf,
    delete: isAdmin,
    admin: ({ req: { user } }) => Boolean(user?.roles?.includes("admin")),
  },
  fields: [
    { name: "name", type: "text" },
    { name: "jobTitle", type: "text" },
    // ---- RBAC ----
    {
      name: "roles",
      type: "select",
      hasMany: true,
      required: true,
      defaultValue: ["viewer"],
      options: ["viewer", "author", "reviewer", "publisher", "brand", "siteAdmin", "admin"],
      // Only admins may change roles (prevents privilege escalation by self-edit).
      access: { update: adminOnlyField, create: adminOnlyField },
    },
    // ---- ABAC attributes ----
    {
      name: "sites",
      type: "relationship",
      relationTo: "sites",
      hasMany: true,
      admin: { description: "Site scope — editors are limited to content in these sites (empty = all)." },
      access: { update: adminOnlyField },
    },
    {
      name: "department",
      type: "select",
      options: ["marketing", "editorial", "communications", "hr", "product", "executive"],
      admin: { description: "Used for attribute-based access (e.g. HR owns Careers)." },
      access: { update: adminOnlyField },
    },
    {
      name: "locales",
      type: "json",
      admin: { description: "Locale scope (array, empty = all locales)." },
      access: { update: adminOnlyField },
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Deactivated users cannot sign in." },
      access: { update: adminOnlyField },
    },
    // When the user last opened their notifications — drives the unread badge.
    // Self-updatable (no adminOnlyField), so each user can clear their own.
    { name: "notificationsReadAt", type: "date", admin: { hidden: true } },
  ],
  hooks: {
    // Block sign-in for deactivated users.
    beforeLogin: [
      ({ user }) => {
        if (user && (user as any).active === false) {
          throw new Error("This account is deactivated. Contact an administrator.");
        }
      },
    ],
  },
};
