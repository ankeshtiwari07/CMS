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
import { AuditLog } from "./collections/AuditLog";
import { contentCollections } from "./collections/content-types";

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
    meta: {
      titleSuffix: "· HUMAIN CMS",
    },
  },
  // Arabic-first: EN (LTR) + AR (RTL), parity by config
  localization: {
    locales: [
      { label: "English", code: "en" },
      { label: "العربية", code: "ar", rtl: true },
    ],
    defaultLocale: "en",
    fallback: true,
  },
  collections: [Users, Sites, Media, Pages, Projects, AuditLog, ...contentCollections],
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI },
    // Dev: auto-sync schema (push). Prod: generated migrations run via `payload migrate`.
    push: process.env.NODE_ENV !== "production",
  }),
  cors: (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3002").split(","),
  csrf: (process.env.CSRF_ORIGINS || "http://localhost:3000,http://localhost:3002").split(","),
  plugins: [...storagePlugins],
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  // OIDC: see docs §Auth — a custom strategy validates the IdP token and maps
  // group claims -> roles. Local auth on Users remains for break-glass admin.
});
