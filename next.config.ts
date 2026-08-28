import type { NextConfig } from "next";

const apiProxyTarget =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") || "http://localhost:8080";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "10.10.65.239",
    "172.31.32.1",
  ],
  async rewrites() {
    return [
      {
        // Browser calls /api/* on the Next origin; Next proxies to core-api.
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
