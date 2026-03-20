import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.cdninstagram.com" },
      { protocol: "https", hostname: "*.fbcdn.net" },
      { protocol: "https", hostname: "p16-sign.tiktokcdn-us.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
