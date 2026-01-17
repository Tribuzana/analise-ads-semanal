/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tribuzana.com.br',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
