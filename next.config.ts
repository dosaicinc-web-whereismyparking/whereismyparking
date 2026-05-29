import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // standalone output is required for the production Dockerfile.
  // It generates .next/standalone — a self-contained Node.js server.
  output: 'standalone',
  allowedDevOrigins: ['100.64.183.55'],
  turbopack: {
    root: process.cwd()
  },
  // Ensure HTML pages are never cached by browsers or CDNs.
  // This prevents stale JS chunk references after new deployments,
  // which cause "This page couldn't load" / "Failed to find Server Action" errors.
  async headers() {
    return [
      {
        // Apply no-cache to all page routes (not static assets)
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma',        value: 'no-cache' },
          { key: 'Expires',       value: '0' },
        ],
      },
    ]
  },
}

export default nextConfig
