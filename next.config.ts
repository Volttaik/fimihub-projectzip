import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  allowedDevOrigins: ['*.replit.dev', '*.repl.co'],
  experimental: {
    serverActions: { allowedOrigins: ['*'] },
  },
}

export default nextConfig
