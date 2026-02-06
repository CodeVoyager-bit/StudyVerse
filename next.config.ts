import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-supabase-project-id.supabase.co',
      },
    ],
  },
  output: 'standalone',
};

export default nextConfig;
