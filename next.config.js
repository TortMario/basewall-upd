/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['base.org', 'warpcast.com'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },
}

module.exports = nextConfig

