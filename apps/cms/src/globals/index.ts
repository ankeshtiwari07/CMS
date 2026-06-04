import type { GlobalConfig } from "payload";
import { isEditor, canPublish } from "../access/roles";

// Site-wide navigation (header + footer menus), localized.
export const Navigation: GlobalConfig = {
  slug: "navigation",
  access: { read: () => true, update: canPublish },
  fields: [
    {
      name: "header",
      type: "array",
      localized: true,
      fields: [
        { name: "label", type: "text", required: true },
        { name: "href", type: "text", required: true },
      ],
    },
    {
      name: "footer",
      type: "array",
      localized: true,
      fields: [
        { name: "label", type: "text", required: true },
        { name: "href", type: "text", required: true },
      ],
    },
  ],
};

// Global brand + SEO defaults.
export const GlobalSettings: GlobalConfig = {
  slug: "settings",
  access: { read: () => true, update: canPublish },
  fields: [
    { name: "siteName", type: "text", localized: true, defaultValue: "HUMAIN" },
    { name: "tagline", type: "text", localized: true },
    { name: "logo", type: "upload", relationTo: "media" },
    {
      name: "social",
      type: "array",
      fields: [
        { name: "platform", type: "text", required: true },
        { name: "url", type: "text", required: true },
      ],
    },
    {
      name: "defaultSeo",
      type: "group",
      fields: [
        { name: "metaTitle", type: "text", localized: true },
        { name: "metaDescription", type: "textarea", localized: true },
        { name: "ogImage", type: "upload", relationTo: "media" },
      ],
    },
    {
      name: "analytics",
      type: "group",
      fields: [
        { name: "ga4MeasurementId", type: "text" },
        { name: "gtmContainerId", type: "text" },
      ],
    },
  ],
};

export const globals: GlobalConfig[] = [Navigation, GlobalSettings];
