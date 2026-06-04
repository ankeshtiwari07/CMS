import type { CollectionConfig } from "payload";
import { isAdmin, isEditor } from "../access/roles";

export const Sites: CollectionConfig = {
  slug: "sites",
  admin: { useAsTitle: "name" },
  access: { read: isEditor, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "domain", type: "text", required: true, unique: true },
    { name: "defaultLocale", type: "select", defaultValue: "en", options: ["en", "ar"] },
    { name: "brand", type: "select", defaultValue: "humain", options: ["humain"] },
  ],
};
