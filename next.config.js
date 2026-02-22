/** @type {import('next').NextConfig} */
// در پروداکشن (بعد از npm prune --production) این پکیج وجود ندارد؛ شرطی لود می‌کنیم
let withBundleAnalyzer = (config) => config;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (_) {
  // در کانتینر پروداکشن پکیج نصب نیست — بدون آنالایزر ادامه می‌دهیم
}

let withPWA = (config) => config;
try {
  withPWA = require('next-pwa')({
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
          expiration: { maxEntries: 200 },
        },
      },
    ],
  });
} catch (_) {
  // در کانتینر پروداکشن بعد از npm prune پکیج نصب نیست — بدون PWA ادامه می‌دهیم
}

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
    // TODO: Fix TypeScript errors and set to false
    // There are ~50+ type errors that need to be fixed first
    // Run: npx tsc --noEmit to see all errors
    ignoreBuildErrors: true,
  },
  eslint: {
    // TODO: Fix ESLint errors and set to false
    ignoreDuringBuilds: true,
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

module.exports = withBundleAnalyzer(withPWA(nextConfig));

