import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize production builds
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  
  // Enable experimental features for better performance
  experimental: {
    typedRoutes: true,
    serverComponentsExternalPackages: ["chokidar", "pino"],
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }

    // Optimize for file system watching libraries
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push("chokidar");
    }

    return config;
  },

  // Environment variables that should be available to the client
  env: {
    NODE_ENV: process.env.NODE_ENV,
  },

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
  
  // Disable telemetry in production
  telemetry: false,
};

export default nextConfig;
