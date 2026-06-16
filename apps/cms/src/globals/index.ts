import type { GlobalConfig } from "payload";
import { isEditor, canManageGlobals } from "../access/roles";

// Site-wide navigation (header + footer menus), localized.
export const Navigation: GlobalConfig = {
  slug: "navigation",
  access: { read: () => true, update: canManageGlobals },
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
  access: { read: () => true, update: canManageGlobals },
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
    // User-built design theme (edited live in the Design System screen).
    {
      name: "theme",
      type: "group",
      fields: [
        { name: "primary", type: "text", defaultValue: "#00A18B" },
        { name: "primaryDark", type: "text", defaultValue: "#0E7C6B" },
        { name: "accent", type: "text", defaultValue: "#C2E54B" },
        { name: "ink", type: "text", defaultValue: "#1A1A1A" },
        { name: "canvas", type: "text", defaultValue: "#FFFFFF" },
        { name: "muted", type: "text", defaultValue: "#6B7280" },
        { name: "font", type: "text", defaultValue: "Inter" },
        { name: "radius", type: "number", defaultValue: 18 },
        { name: "mode", type: "select", defaultValue: "light", options: ["light", "dark"] },
      ],
    },
  ],
};

export const globals: GlobalConfig[] = [Navigation, GlobalSettings];
