import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://driving-school-1-4wjx.onrender.com/api/:path*",
      },
    ];
  },
};

export default nextConfig;
