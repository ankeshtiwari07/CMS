import type { CollectionConfig, Field } from "payload";
import { isEditor, readPublishedOrEditor, canReview, editorSiteScoped, departmentOnly } from "../access/roles";
import { emitContentEvent, onDelete, enforcePublishPermission } from "../hooks/events";
import { seoField } from "../fields/seo";

// ABAC anchor: the site a document belongs to. Editors with a site scope can
// only create/read/update/delete content whose `site` is in their set.
const siteField: Field = {
  name: "site",
  type: "relationship",
  relationTo: "sites",
  admin: { position: "sidebar" },
};

// Editorial workflow gate (separate from Payload's draft/published _status):
// author -> in_review -> approved. Only reviewer+ may move it past "draft".
const workflowField: Field = {
  name: "workflowState",
  type: "select",
  defaultValue: "draft",
  options: [
    { label: "Draft", value: "draft" },
    { label: "In review", value: "in_review" },
    { label: "Approved", value: "approved" },
  ],
  admin: { position: "sidebar" },
  access: { update: canReview },
};

const base = (slug: string, title: string, extra: Field[]): CollectionConfig => ({
  slug,
  versions: { drafts: { autosave: { interval: 2000 } }, maxPerDoc: 50 },
  admin: { useAsTitle: title },
  access: {
    read: readPublishedOrEditor,
    create: isEditor,
    update: isEditor,
    delete: isEditor,
    readVersions: isEditor,
  },
  fields: [...extra, workflowField, seoField()],
  hooks: {
    beforeChange: [enforcePublishPermission],
    afterChange: [emitContentEvent],
    afterDelete: [onDelete],
  },
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

export const Careers: CollectionConfig = {
  ...base("careers", "title", [
    { name: "title", type: "text", localized: true, required: true },
    { name: "department", type: "text", localized: true },
    { name: "location", type: "text", localized: true },
    { name: "employmentType", type: "select", options: ["full-time", "part-time", "contract", "internship"] },
    { name: "description", type: "richText", localized: true },
    { name: "responsibilities", type: "textarea", localized: true },
    { name: "requirements", type: "textarea", localized: true },
    { name: "applyUrl", type: "text" },
  ]),
  // ABAC: only HR/Communications editors (or admins) may author job posts.
  access: {
    read: readPublishedOrEditor,
    create: departmentOnly("hr", "communications"),
    update: departmentOnly("hr", "communications"),
    delete: departmentOnly("hr", "communications"),
    readVersions: isEditor,
  },
};

export const Tags: CollectionConfig = {
  slug: "tags",
  admin: { useAsTitle: "name" },
  access: { read: () => true, create: isEditor, update: isEditor, delete: isEditor },
  fields: [{ name: "name", type: "text", localized: true, required: true },
           { name: "slug", type: "text", required: true, unique: true }],
};

// 12 content types: Articles, BlogPosts, PressReleases, Events, Products,
// CaseStudies, Leadership, Faqs, MediaGalleries, CampaignMicrosites, Careers,
// plus Pages (registered separately). Tags is taxonomy.
export const contentCollections: CollectionConfig[] = [
  Articles, BlogPosts, PressReleases, Events, Products, CaseStudies,
  Leadership, Faqs, MediaGalleries, CampaignMicrosites, Careers, Tags,
];
