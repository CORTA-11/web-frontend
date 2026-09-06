import type { NextConfig } from "next";

const apiProxyTarget =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") || "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "10.10.65.239",
    "172.31.32.1",
  ],
  async rewrites() {
    return [
      {
        // Browser calls /api/* on the Next origin; Next proxies to core-api,
        // preserving the /api prefix because core-api mounts under /api/v1.
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
