import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // 生产构建时只检查错误，不检查警告
    ignoreDuringBuilds: false,
  },
  typescript: {
    // 忽略类型检查错误（仅在开发时检查）
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
