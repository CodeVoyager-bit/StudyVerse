import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    },
  },
  images: {
    domains: ['your-supabase-project-id.supabase.co'],
  },
};

export default nextConfig;
