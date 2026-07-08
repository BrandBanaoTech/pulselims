import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    root:require('path').resolve(__dirname, './'),
  }
};

export default nextConfig;
