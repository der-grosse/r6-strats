import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  productionBrowserSourceMaps: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.devtool = "source-map";
    }
    return config;
  },
};

export default nextConfig;
