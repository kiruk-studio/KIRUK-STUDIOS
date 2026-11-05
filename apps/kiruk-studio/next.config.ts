import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // A build check can run beside `next dev` without clobbering it: NEXT_DIST_DIR=.next-check next build
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  transpilePackages: ['three', '@kiruk/burin'],
};

export default nextConfig;
