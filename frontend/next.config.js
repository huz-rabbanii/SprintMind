/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : 'http://127.0.0.1:8000/api/:path*',
      },
    ]
  },
  images: { domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'] },
}

module.exports = nextConfig
