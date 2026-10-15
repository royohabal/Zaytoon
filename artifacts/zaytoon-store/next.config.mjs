import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { CLERK_PROXY_PATH } from '@workspace/store-api/clerk';

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const vercelClerkProxyUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}${CLERK_PROXY_PATH}`
  : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  transpilePackages: [
    '@workspace/api-client-react',
    '@workspace/api-zod',
    '@workspace/store-api',
  ],
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
      process.env.VITE_CLERK_PUBLISHABLE_KEY ??
      '',
    NEXT_PUBLIC_CLERK_PROXY_URL:
      process.env.NEXT_PUBLIC_CLERK_PROXY_URL ??
      process.env.VITE_CLERK_PROXY_URL ??
      vercelClerkProxyUrl,
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(appRoot, 'src'),
      '@assets': path.resolve(appRoot, '..', '..', 'attached_assets'),
      '@tanstack/react-query': require.resolve('@tanstack/react-query'),
    };
    return config;
  },
};

export default nextConfig;
