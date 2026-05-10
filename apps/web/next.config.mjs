/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@psich/types'],
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
};

export default nextConfig;
