/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for Vercel serverless deployment
  serverExternalPackages: ['pdfjs-dist'],
  
  // Webpack configuration for PDF.js optimization
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Server-side optimizations for PDF.js
      config.resolve.alias = {
        ...config.resolve.alias,
        // Use legacy build for better Node.js compatibility
        'pdfjs-dist': 'pdfjs-dist/legacy/build/pdf.mjs'
      }
      
      // Exclude canvas from server bundle (not needed for text extraction)
      config.externals = config.externals || []
      config.externals.push('canvas')
    }
    
    return config
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/api/pdf/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig