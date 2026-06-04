import type { CollectionConfig } from "payload";
import { isAdmin } from "../access/roles";

export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    // Local auth for break-glass admin; OIDC strategy added in payload.config.ts
    tokenExpiration: 60 * 60 * 8,
    cookies: { sameSite: "Lax", secure: process.env.NODE_ENV === "production" },
  },
  admin: { useAsTitle: "email" },
  access: {
    create: isAdmin, read: isAdmin, update: isAdmin, delete: isAdmin,
  },
  fields: [
    { name: "name", type: "text" },
    { name: "roles", type: "select", hasMany: true, required: true, defaultValue: ["viewer"],
      options: ["viewer", "author", "reviewer", "publisher", "brand", "admin"] },
    { name: "sites", type: "relationship", relationTo: "sites", hasMany: true },
  ],
};
