/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ],
    dangerouslyAllowSVG: false
  }
};

export default nextConfig;
