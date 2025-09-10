import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize production builds
  compress: true,
  productionBrowserSourceMaps: false,
  
  // Enable features for better performance
  typedRoutes: true,
  serverExternalPackages: ["chokidar", "pino"],

  // Allow additional dev origins to request internal assets/endpoints
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  allowedDevOrigins: [
    "172.31.187.253",
  ],

  // Turbopack-friendly config: no custom Webpack overrides

  // Headers for security and performance
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },

  // Output standalone for Docker deployment
  output: "standalone",
};

export default nextConfig;
