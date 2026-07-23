import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Fail the production build on type errors instead of silently shipping
  // them (this is the default, made explicit for clarity).
  typescript: { ignoreBuildErrors: false },
};

export default withNextIntl(nextConfig);
