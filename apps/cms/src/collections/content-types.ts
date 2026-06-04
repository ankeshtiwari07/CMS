import type { CollectionConfig, Field } from "payload";
import { isEditor, readPublishedOrEditor } from "../access/roles.js";
import { emitContentEvent, onDelete } from "../hooks/events.js";
import { seoField } from "../fields/seo.js";

const base = (slug: string, title: string, extra: Field[]): CollectionConfig => ({
  slug,
  versions: { drafts: { autosave: { interval: 2000 } }, maxPerDoc: 50 },
  admin: { useAsTitle: title },
  access: { read: readPublishedOrEditor, create: isEditor, update: isEditor, delete: isEditor, readVersions: isEditor },
  fields: [...extra, seoField()],
  hooks: { afterChange: [emitContentEvent], afterDelete: [onDelete] },
});

const templateField = (opts: string[]): Field =>
  ({ name: "template", type: "select", defaultValue: opts[0], options: opts });

// Article (Professional/Academic/Feature)
export const Articles = base("articles", "title", [
  templateField(["professional", "academic", "feature"]),
  { name: "title", type: "text", localized: true, required: true },
  { name: "introduction", type: "textarea", localized: true },
  { name: "body", type: "richText", localized: true },
  { name: "conclusion", type: "textarea", localized: true },
  { name: "author", type: "relationship", relationTo: "leadership" },
  { name: "tags", type: "relationship", relationTo: "tags", hasMany: true },
]);

// Blog (Modern/Editorial/Minimalist)
export const BlogPosts = base("blogPosts", "headline", [
  templateField(["modern", "editorial", "minimalist"]),
  { name: "headline", type: "text", localized: true, required: true },
  { name: "cta", type: "text", localized: true },
  { name: "hook", type: "textarea", localized: true },
  { name: "problem", type: "textarea", localized: true },
  { name: "solution", type: "richText", localized: true },
  { name: "conclusion", type: "textarea", localized: true },
  { name: "examples", type: "textarea", localized: true },
  { name: "tags", type: "relationship", relationTo: "tags", hasMany: true },
]);

// Press Release (Corporate/Tech Launch/Partnership)
export const PressReleases = base("pressReleases", "headline", [
  templateField(["corporate", "techLaunch", "partnership"]),
  { name: "headline", type: "text", localized: true, required: true },
  { name: "releaseInfo", type: "text", localized: true },
  { name: "subHeadline", type: "text", localized: true },
  { name: "opening", type: "textarea", localized: true },
  { name: "body", type: "richText", localized: true },
  { name: "quote", type: "textarea", localized: true },
  { name: "companyInfo", type: "textarea", localized: true },
  { name: "mediaContact", type: "text", localized: true },
]);

// Events / Webinars (Conference/Webinar/Workshop)
export const Events = base("events", "title", [
  templateField(["conference", "webinar", "workshop"]),
  { name: "title", type: "text", localized: true, required: true },
  { name: "eventType", type: "text" },
  { name: "overview", type: "textarea", localized: true },
  { name: "date", type: "date" },
  { name: "startTime", type: "text" },
  { name: "endTime", type: "text" },
  { name: "venue", type: "text", localized: true },
  { name: "organizer", type: "text", localized: true },
  { name: "details", type: "richText", localized: true },
  { name: "objectives", type: "textarea", localized: true },
  { name: "targetAudience", type: "textarea", localized: true },
  { name: "agenda", type: "array", localized: true, fields: [
    { name: "time", type: "text" }, { name: "item", type: "text", localized: true } ] },
  { name: "speakers", type: "array", localized: true, fields: [
    { name: "name", type: "text" }, { name: "title", type: "text", localized: true } ] },
]);

export const Products = base("products", "name", [
  { name: "name", type: "text", localized: true, required: true },
  { name: "summary", type: "textarea", localized: true },
  { name: "features", type: "array", localized: true, fields: [
    { name: "title", type: "text", localized: true }, { name: "desc", type: "textarea", localized: true } ] },
  { name: "industry", type: "relationship", relationTo: "tags" },
]);

export const CaseStudies = base("caseStudies", "title", [
  { name: "title", type: "text", localized: true, required: true },
  { name: "client", type: "text", localized: true },
  { name: "challenge", type: "textarea", localized: true },
  { name: "solution", type: "richText", localized: true },
  { name: "results", type: "textarea", localized: true },
]);

export const Leadership = base("leadership", "name", [
  { name: "name", type: "text", required: true },
  { name: "role", type: "text", localized: true },
  { name: "bio", type: "richText", localized: true },
  { name: "photo", type: "upload", relationTo: "media" },
]);

export const Faqs = base("faqs", "question", [
  { name: "question", type: "text", localized: true, required: true },
  { name: "answer", type: "richText", localized: true, required: true },
  { name: "category", type: "text", localized: true },
]);

export const MediaGalleries = base("mediaGalleries", "title", [
  { name: "title", type: "text", localized: true, required: true },
  { name: "items", type: "array", fields: [
    { name: "media", type: "upload", relationTo: "media", required: true },
    { name: "caption", type: "text", localized: true } ] },
]);

export const CampaignMicrosites = base("campaignMicrosites", "title", [
  { name: "title", type: "text", localized: true, required: true },
  { name: "theme", type: "select", defaultValue: "studio", options: ["studio", "cms", "neutral"] },
]);

export const Tags: CollectionConfig = {
  slug: "tags",
  admin: { useAsTitle: "name" },
  access: { read: () => true, create: isEditor, update: isEditor, delete: isEditor },
  fields: [{ name: "name", type: "text", localized: true, required: true },
           { name: "slug", type: "text", required: true, unique: true }],
};

export const contentCollections: CollectionConfig[] = [
  Articles, BlogPosts, PressReleases, Events, Products, CaseStudies,
  Leadership, Faqs, MediaGalleries, CampaignMicrosites, Tags,
];
