import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable large file uploads (max 1GB for BUSINESS plan)
  experimental: {
    // Server Actions body size limit
    serverActions: {
      bodySizeLimit: '1gb',
    },
    // CRITICAL: Middleware/proxy body size limit for API Route Handlers
    // Default is 10MB - must increase for file uploads
    // This fixes "Request body exceeded 10MB" error
    middlewareClientMaxBodySize: '1gb',
  },

  // Image optimization config
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default nextConfig;
