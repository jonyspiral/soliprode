import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "soliprode.com",
          },
        ],
        destination: "https://www.soliprode.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
