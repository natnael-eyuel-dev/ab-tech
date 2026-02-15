import type { NextConfig } from "next";

const backendPort = process.env.BACKEND_PORT || "4000";
const hostname = process.env.HOSTNAME || "localhost";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async rewrites() {
    if (process.env.NODE_ENV !== "production") {
      return [
        {
          source: "/api/socketio/:path*",
          destination: `http://${hostname}:${backendPort}/api/socketio/:path*`,
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
