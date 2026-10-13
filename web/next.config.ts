import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['chogbound-sim'],
  poweredByHeader: false,
  webpack(config) {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
