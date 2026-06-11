import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // standalone output is required for the production Dockerfile.
  // It generates .next/standalone — a self-contained Node.js server.
  output: 'standalone',
  allowedDevOrigins: ['100.64.183.55'],
  images: {
    // Serve modern formats; Next falls back automatically for older browsers.
    formats: ['image/avif', 'image/webp'],
    // Allow listing/owner-uploaded images served from Supabase storage.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  turbopack: {
    root: process.cwd()
  },
  // Ensure HTML pages are never cached by browsers or CDNs.
  // This prevents stale JS chunk references after new deployments,
  // which cause "This page couldn't load" / "Failed to find Server Action" errors.
  async headers() {
    return [
      {
        // Immutable cache for hashed static assets — safe because filenames change each build
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control',              value: 'public, max-age=31536000, immutable' },
          { key: 'CDN-Cache-Control',          value: 'public, max-age=31536000, immutable' },
          { key: 'Cloudflare-CDN-Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // All page routes: never cache in browser or CDN.
        // Prevents stale chunk references after deploys ("This page couldn't load",
        // "Failed to find Server Action" errors on mobile and desktop).
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control',              value: 'no-store, no-cache, must-revalidate' },
          { key: 'CDN-Cache-Control',          value: 'no-store' },
          { key: 'Cloudflare-CDN-Cache-Control', value: 'no-store' },
          { key: 'Pragma',                     value: 'no-cache' },
          { key: 'Expires',                    value: '0' },
        ],
      },
    ]
  },
}

export default nextConfig
