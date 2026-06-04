/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@humain/design-tokens", "@humain/ui", "@humain/blocks"],
};

export default nextConfig;
