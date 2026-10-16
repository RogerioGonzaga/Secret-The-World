import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Domínio canônico sem "www": o provedor de hospedagem também pode fazer isso, esta regra é uma garantia.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.partiumorar.com.br" }],
        destination: "https://partiumorar.com.br/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
