import type { NextConfig } from 'next';

const allowedOrigins = (process.env.NEXT_PUBLIC_ALLOWED_ORIGINS ?? 'localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins },
  },
};

export default nextConfig;
