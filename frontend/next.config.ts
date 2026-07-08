import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ['lucide-react'],
  turbopack: {
    root:require('path').resolve(__dirname, './'),
  }
};

export default nextConfig;
