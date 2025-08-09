/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  typescript: {
    // Temporarily ignore build errors during development
    ignoreBuildErrors: false,
  },
  eslint: {
    // Temporarily ignore ESLint errors during builds
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig