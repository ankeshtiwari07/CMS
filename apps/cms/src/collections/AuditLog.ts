import type { CollectionConfig } from "payload";
import { isAdmin } from "../access/roles.js";

// Append-only audit trail of content mutations. Readable by admins only; writes
// happen exclusively via the afterChange/afterDelete hooks (no UI create/update).
export const AuditLog: CollectionConfig = {
  slug: "auditLog",
  admin: { useAsTitle: "summary", defaultColumns: ["summary", "action", "collectionSlug", "user", "createdAt"], group: "System" },
  access: {
    read: isAdmin,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: "summary", type: "text", required: true },
    { name: "action", type: "select", required: true, options: ["create", "update", "publish", "delete"] },
    { name: "collectionSlug", type: "text", required: true },
    { name: "documentId", type: "text", required: true },
    { name: "user", type: "text" },
    { name: "ip", type: "text" },
    { name: "diff", type: "json" },
  ],
  timestamps: true,
};
