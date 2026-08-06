/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  env: {
    AUTH_SECRET: process.env.AUTH_SECRET,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias["onnxruntime-web/webgpu"] = false;
    return config;
  },
  turbopack: {},
  async headers() {
    // Lets the Discover app (a separate origin) call /api/public/* at all —
    // everything else in the app stays same-origin only, unaffected.
    return [
      {
        source: "/api/public/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: process.env.DISCOVER_APP_ORIGIN || "" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PATCH,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, x-api-key" },
        ],
      },
    ];
  },
};

export default nextConfig;