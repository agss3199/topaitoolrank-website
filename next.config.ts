import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  typescript: {
    ignoreBuildErrors: true, // CSS Module types causing false positives
  },

  // Image optimization for blog hero images and content
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    minimumCacheTTL: 86400, // 24 hours
  },

  // Headers and caching
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
      },
      {
        source: "/blogs/:slug",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400"
          }
        ]
      },
      {
        source: "/blogs",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, s-maxage=3600"
          }
        ]
      },
      {
        source: "/tools/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, s-maxage=3600"
          }
        ]
      }
    ];
  },

  // Optimize bundle
  productionBrowserSourceMaps: false,
};

export default nextConfig;
