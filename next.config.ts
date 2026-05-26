import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // standalone output is required for the production Dockerfile.
  // It generates .next/standalone — a self-contained Node.js server.
  output: 'standalone',
  allowedDevOrigins: ['100.64.183.55'],
  turbopack: {
    root: process.cwd()
  }
}

export default nextConfig
