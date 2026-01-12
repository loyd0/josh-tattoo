import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow Vercel Blob public URLs to be used with `next/image`.
    // Note: Blob hostnames include a per-store subdomain (e.g. `xxxx.public.blob.vercel-storage.com`).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tjllpp7eillhvpk8.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
