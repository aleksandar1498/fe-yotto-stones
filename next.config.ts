// next.config.ts
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    dirs: ['app', 'components', 'pages', 'lib'], // adjust as needed
  },
  experimental: {
    scrollRestoration: true,
  },
  images: {
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
