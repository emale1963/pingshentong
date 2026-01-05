import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // 允许更大的文件上传（20MB）
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};

export default nextConfig;
