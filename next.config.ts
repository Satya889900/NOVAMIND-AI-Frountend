import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy /api/* requests to the Express backend during dev
  // This prevents CORS issues when running frontend on :3000 and backend on :5000
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/:path*`,
      },
    ];
  },

  // Allow images from backend / external domains
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
