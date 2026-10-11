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
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  poweredByHeader: false,
  headers: async () => [
    {
      source: '/assets/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }],
    },
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
