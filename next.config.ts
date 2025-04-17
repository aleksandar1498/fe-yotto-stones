// next.config.ts
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ['app', 'components', 'pages', 'lib'], // adjust as needed
    ignoreDuringBuilds: true,
  },
  experimental: {
    scrollRestoration: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/yotto-stones.firebasestorage.app/o/**',
      },
    ],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
      ],
    },
  ],
};

export default nextConfig;
