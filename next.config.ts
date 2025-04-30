import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['your-supabase-project-id.supabase.co'],
  },
};

export default nextConfig;
