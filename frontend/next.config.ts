import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Proxy every /api/* request to the FastAPI backend.
        // This makes cookies same-site (3000→3000 in the browser's view)
        // so SameSite=Lax cookies are forwarded correctly on JS fetch() calls.
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
