import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/pomodoro-app",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
