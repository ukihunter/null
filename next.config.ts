import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // <-- Added for Google user images
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply COEP/COOP to editor routes (required for WebContainers / SharedArrayBuffer)
        // credentialless is used instead of require-corp so third-party CDN resources still load
        source: "/editor/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
        ],
      },
    ];
  },
  reactStrictMode: false,
};

export default nextConfig;
