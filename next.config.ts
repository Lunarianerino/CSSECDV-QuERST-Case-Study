import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure external packages for server components
  serverExternalPackages: ["mongoose"],
  // Configure middleware settings to allow dynamic code evaluation
  experimental: {},
  // Allow dynamic code evaluation for Mongoose in middleware
  // This fixes the compatibility issue with Edge Runtime
  unstable_allowDynamic: [
    '**/node_modules/mongoose/**',
  ],
};

export default nextConfig;
