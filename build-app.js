#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Building app version for Netlify deployment...');

// Set environment variables
process.env.NEXT_PUBLIC_APP_MODE = 'app';
process.env.BUILD_MODE = 'app';

// Paths to temporarily move (all problematic routes for static export)
const pathsToBackup = [
  { original: path.join(__dirname, 'app', 'api'), backup: path.join(__dirname, 'app', '_api_backup') },
  { original: path.join(__dirname, 'app', 'mentor'), backup: path.join(__dirname, 'app', '_mentor_backup') },
  { original: path.join(__dirname, 'app', 'admin'), backup: path.join(__dirname, 'app', '_admin_backup') },
  { original: path.join(__dirname, 'app', 'student'), backup: path.join(__dirname, 'app', '_student_backup') },
  // We'll keep essential routes and exclude complex features for the app version
];

const movedPaths = [];

try {
  // Backup problematic routes
  for (const pathInfo of pathsToBackup) {
    if (fs.existsSync(pathInfo.original)) {
      console.log(`📁 Temporarily moving ${path.basename(pathInfo.original)}...`);
      fs.renameSync(pathInfo.original, pathInfo.backup);
      movedPaths.push(pathInfo);
    }
  }

  // Update next.config.mjs for static export
  const configPath = path.join(__dirname, 'next.config.mjs');
  const originalConfig = fs.readFileSync(configPath, 'utf8');
  
  const appConfig = `/** @type {import('next').NextConfig} */
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

export default nextConfig`;

  fs.writeFileSync(configPath, appConfig);
  console.log('⚙️  Updated Next.js config for static export...');

  // Run the build
  console.log('🔨 Building the app...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✅ App build completed successfully!');
  console.log('📦 Static files are ready in the "out" directory');
  console.log('🌐 Ready for Netlify deployment!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} finally {
  // Restore all moved paths
  for (const pathInfo of movedPaths) {
    if (fs.existsSync(pathInfo.backup)) {
      console.log(`🔄 Restoring ${path.basename(pathInfo.original)}...`);
      fs.renameSync(pathInfo.backup, pathInfo.original);
    }
  }
}