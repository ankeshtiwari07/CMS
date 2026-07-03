import { withPayload } from "@payloadcms/next/withPayload";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Served on the SAME origin as the console (a separate Next app) at /admin.
  // Both apps would otherwise emit assets under /_next and collide, so the
  // Payload app's static assets are prefixed; nginx maps /cms-assets/_next/* to
  // this container's /_next/*. Overridable via CMS_ASSET_PREFIX.
  assetPrefix: process.env.CMS_ASSET_PREFIX || "/cms-assets",
  // Payload bundles these server-only packages itself.
  serverExternalPackages: ["sharp"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
