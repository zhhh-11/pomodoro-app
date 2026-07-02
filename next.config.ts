import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Use a custom domain or the default GitHub Pages URL
  // basePath: "/pomodoro-app", // uncomment if repo name is not the root domain
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
