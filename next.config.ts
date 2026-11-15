import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // YouTube thumbnails in the resource library.
  images: { remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com' }] },
};

export default nextConfig;
