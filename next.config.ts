import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // MVP: imagens de produto vêm de URLs externas informadas pelo lojista.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
