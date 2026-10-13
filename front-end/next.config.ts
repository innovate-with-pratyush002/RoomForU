import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  devIndicators: false,
  outputFileTracingRoot: path.join(__dirname, "../"),
};

export default nextConfig;
