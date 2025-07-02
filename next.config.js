/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 's-r-m.s3.us-east-1.amazonaws.com'],
  },
}

module.exports = nextConfig 