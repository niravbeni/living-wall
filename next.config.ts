import type { NextConfig } from "next";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/media-proxy/:path*",
        destination: `${SUPABASE_URL}/storage/v1/object/public/media/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/media-proxy/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "CDN-Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Vercel-CDN-Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
