import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 允许局域网 IP 访问开发服务器
  // 注意: "*" 作为 allowedDevOrigins 值是被Next.js显式禁止的
  // 需要列出具体的IP地址或域名
  allowedDevOrigins: [
    "192.168.0.104",
    "*.trycloudflare.com",
  ],
};

export default nextConfig;
