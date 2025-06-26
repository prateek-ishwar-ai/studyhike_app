/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Static export for app deployment
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
  serverExternalPackages: ['@supabase/supabase-js'],
  env: {
    NEXT_PUBLIC_APP_MODE: 'app',
    NEXT_PUBLIC_APP_URL: 'https://app.studyhike.in',
  },
}

export default nextConfig