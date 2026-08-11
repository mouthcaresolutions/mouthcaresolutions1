import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* Vercel deployment - no standalone output needed */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
