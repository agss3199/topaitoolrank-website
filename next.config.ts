import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  headers: async () => {
    return [
      {
        source: "/public/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, immutable"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
