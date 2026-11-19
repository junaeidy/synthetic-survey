/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@supabase/supabase-js'],
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
