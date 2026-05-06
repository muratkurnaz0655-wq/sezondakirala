import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** İlan fotoğrafları FormData ile server action’a gider; varsayılan ~1MB yetersiz kalır. */
  experimental: {
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
  async headers() {
    return [
      {
        source: "/videos/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Accept-Ranges", value: "bytes" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.unsplash.com",
      },
    ],
    unoptimized: false,
  },
};

export default nextConfig;
