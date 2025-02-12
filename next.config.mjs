/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    AUTH_SECRET: process.env.AUTH_SECRET,
  },
    images: {
      domains: ['res.cloudinary.com'], // Add Cloudinary's domain here
    },
    webpack: (config) => {
      config.resolve.alias["onnxruntime-web/webgpu"] = false;
      return config;
    },
  };
  
  export default nextConfig;
  

  