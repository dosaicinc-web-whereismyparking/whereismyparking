import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: '*.supabase.co' }],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  allowedDevOrigins: [
    '127.0.0.1',
    'localhost',
    '100.64.183.55',
    'soup.whereismyparking.com',
    'dosas-mac-mini.taildcb374.ts.net',
  ],
};

export default nextConfig;
