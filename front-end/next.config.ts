import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  devIndicators: false,
  outputFileTracingRoot: path.join(__dirname, "../"),
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

export default nextConfig;
