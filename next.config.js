/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Temporarily ignore build errors during development
    ignoreBuildErrors: false,
  },
  eslint: {
    // Temporarily ignore ESLint errors during builds
    ignoreDuringBuilds: false,
  },
  webpack: (config, { isServer }) => {
    // Handle pdf-parse library issues
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'canvas': 'canvas',
      })
    }
    
    // Ignore pdf-parse test files
    config.resolve.alias = {
      ...config.resolve.alias,
    }
    
    config.module.rules.push({
      test: /\.pdf$/,
      type: 'asset/resource',
    })
    
    return config
  },
}

module.exports = nextConfig