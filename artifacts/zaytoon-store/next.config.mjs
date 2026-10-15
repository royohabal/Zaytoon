import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const appRoot = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  transpilePackages: ['@workspace/api-client-react', '@workspace/api-zod'],
  env: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ??
      process.env.VITE_CLERK_PUBLISHABLE_KEY ??
      '',
    NEXT_PUBLIC_CLERK_PROXY_URL:
      process.env.NEXT_PUBLIC_CLERK_PROXY_URL ??
      process.env.VITE_CLERK_PROXY_URL ??
      '',
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
