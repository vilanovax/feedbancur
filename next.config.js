/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.storage.*.liara.space',
      },
      {
        protocol: 'https',
        hostname: '*.liara.space',
      },
      {
        protocol: 'https',
        hostname: 'storage.iran.liara.space',
      },
      {
        protocol: 'https',
        hostname: 'storage.c2.liara.space',
      },
    ],
    unoptimized: false,
  },
  typescript: {
    // Temporarily ignore build errors for type checking
    ignoreBuildErrors: true,
  },
  // تنظیمات برای سازگاری با Next.js 16 و Turbopack
  turbopack: {},
  // تنظیمات برای سازگاری با مرورگر داخلی Cursor
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);

