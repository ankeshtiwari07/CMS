import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Users } from "./collections/Users";
import { Sites } from "./collections/Sites";
import { Media } from "./collections/Media";
import { Pages } from "./collections/Pages";
import { Projects } from "./collections/Projects";
import { Conversations } from "./collections/Conversations";
import { BrandGuidelines } from "./collections/BrandGuidelines";
import { AuditLog } from "./collections/AuditLog";
import { Approvals } from "./collections/Approvals";
import { Components } from "./collections/Components";
import { Decks } from "./collections/Decks";
import { AiWebsites } from "./collections/AiWebsites";
import { ContentVersions } from "./collections/ContentVersions";
import { Leads } from "./collections/Leads";
import { contentCollections } from "./collections/content-types";
import { globals } from "./globals";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Only wire S3 when an endpoint is configured; otherwise Payload falls back to
// local-disk uploads (keeps local boot working without MinIO).
//
// CRITICAL: also include the plugin during the build-time importMap generation
// (CMS_BUILD=1). The admin importMap is baked into the image at build time,
// when .env.production — and therefore S3_ENDPOINT — is NOT present. Without
// this, the plugin's `S3ClientUploadHandler` admin component is omitted from
// the map, but at runtime S3_ENDPOINT *is* set, so the plugin loads and
// references that component. Payload then fails to resolve it
// (`getFromImportMap: PayloadComponent not found`) and the ENTIRE admin renders
// blank. Keying on CMS_BUILD makes the build-time component set match runtime.
// The placeholder credentials are used only for codegen (the plugin is never
// contacted during importMap generation); real values come from env at runtime.
const s3Configured = !!process.env.S3_ENDPOINT;
const includeS3 = s3Configured || process.env.CMS_BUILD === "1";
const storagePlugins = includeS3
  ? [
      s3Storage({
        collections: { media: true },
        bucket: process.env.S3_BUCKET || "build-placeholder-bucket",
        config: {
          endpoint: process.env.S3_ENDPOINT || "https://s3.build-placeholder.invalid",
          region: process.env.S3_REGION || "me-central-1",
          forcePathStyle: true,
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY || "build-placeholder",
            secretAccessKey: process.env.S3_SECRET_KEY || "build-placeholder",
          },
        },
      }),
    ]
  : [];

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3001",
  secret: process.env.PAYLOAD_SECRET || "dev-secret-change-me-32-characters-min",
  editor: lexicalEditor(),
  sharp,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      // Brand the embedded Payload admin with the HUMAIN mark instead of the
      // stock Payload logo/hexagon. Login wordmark + compact nav monogram.
      graphics: {
        Logo: "/components/graphics/Logo#default",
        Icon: "/components/graphics/Icon#default",
      },
    },
    meta: {
      titleSuffix: "· HUMAIN CMS",
    },
  },
  // The admin is served on the SAME host as the console (cms.<ip>.sslip.io/admin).
  // The console owns /api, so the admin CLIENT is told to call Payload's REST at
  // /payload-api; nginx rewrites /payload-api -> the container's native /api, so
  // internal server-to-server callers (console, ai-service) keep using /api
  // unchanged. Its /_next assets are isolated via next.config assetPrefix.
  routes: {
    api: "/payload-api",
    graphQL: "/payload-api/graphql",
    graphQLPlayground: "/payload-api/graphql-playground",
  },
  // Arabic-first + multilingual. Arabic has country dialect locales (RTL);
  // plus French, German, Spanish, Polish. defaultLocale=en, fallback to en.
  localization: {
    locales: [
      { label: "English", code: "en" },
      { label: "العربية (فصحى)", code: "ar", rtl: true },
      { label: "العربية (السعودية)", code: "ar-SA", rtl: true },
      { label: "العربية (مصر)", code: "ar-EG", rtl: true },
      { label: "العربية (الإمارات)", code: "ar-AE", rtl: true },
      { label: "العربية (المغرب)", code: "ar-MA", rtl: true },
      { label: "العربية (لبنان)", code: "ar-LB", rtl: true },
      { label: "Français", code: "fr" },
      { label: "Deutsch", code: "de" },
      { label: "Español", code: "es" },
      { label: "Polski", code: "pl" },
    ],
    defaultLocale: "en",
    fallback: true,
  },
  collections: [Users, Sites, Media, Pages, Projects, Conversations, BrandGuidelines, AuditLog, Approvals, Components, Decks, AiWebsites, ContentVersions, Leads, ...contentCollections],
  globals,
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
    // Dev: auto-sync schema (push). Prod: migrations, unless DB_PUSH=true is set
    // to bootstrap a fresh database on first deploy.
    push: process.env.DB_PUSH ? process.env.DB_PUSH === "true" : process.env.NODE_ENV !== "production",
  }),
  cors: (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3002").split(","),
  csrf: (process.env.CSRF_ORIGINS || "http://localhost:3000,http://localhost:3002").split(","),
  plugins: [...storagePlugins],
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  // OIDC: see docs §Auth — a custom strategy validates the IdP token and maps
  // group claims -> roles. Local auth on Users remains for break-glass admin.
});
