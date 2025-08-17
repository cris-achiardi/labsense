/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for Vercel serverless deployment
  serverExternalPackages: ['pdf-parse'],
  
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