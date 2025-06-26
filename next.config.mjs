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
    NEXT_PUBLIC_APP_URL: 'https://iridescent-sawine-116743.netlify.app',
    // Provide fallback values for missing env vars during build
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
  },
  // Skip problematic routes during static generation
  async generateBuildId() {
    return 'app-build-' + Date.now();
  },
}

export default nextConfig