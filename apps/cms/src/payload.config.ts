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
import { contentCollections } from "./collections/content-types";
import { globals } from "./globals";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Only wire S3 when an endpoint is configured; otherwise Payload falls back to
// local-disk uploads (keeps local boot working without MinIO).
const storagePlugins = process.env.S3_ENDPOINT
  ? [
      s3Storage({
        collections: { media: true },
        bucket: process.env.S3_BUCKET as string,
        config: {
          endpoint: process.env.S3_ENDPOINT,
          region: process.env.S3_REGION || "me-central-1",
          forcePathStyle: true,
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY as string,
            secretAccessKey: process.env.S3_SECRET_KEY as string,
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
  collections: [Users, Sites, Media, Pages, Projects, Conversations, BrandGuidelines, AuditLog, Approvals, Components, ...contentCollections],
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
