const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ],
    dangerouslyAllowSVG: false
  }
};

export default nextConfig;
