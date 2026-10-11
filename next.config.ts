import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Upload de fotos de produto via server action (uma foto por chamada, até 3 MB)
    serverActions: { bodySizeLimit: "4mb" },
  },
  serverExternalPackages: ["@prisma/client", "pg"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
