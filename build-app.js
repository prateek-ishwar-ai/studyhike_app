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
  // New problematic routes to backup
  { original: path.join(__dirname, 'app', 'features'), backup: path.join(__dirname, 'app', '_features_backup') },
  { original: path.join(__dirname, 'app', 'pricing'), backup: path.join(__dirname, 'app', '_pricing_backup') },
  { original: path.join(__dirname, 'app', 'testimonials'), backup: path.join(__dirname, 'app', '_testimonials_backup') },
  { original: path.join(__dirname, 'app', 'debug'), backup: path.join(__dirname, 'app', '_debug_backup') },
  { original: path.join(__dirname, 'app', 'auth'), backup: path.join(__dirname, 'app', '_auth_backup') },
  { original: path.join(__dirname, 'app', 'app'), backup: path.join(__dirname, 'app', '_app_backup') },
  // Keep only the homepage for static export
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

  // Backup layout.tsx and replace with static version
  const layoutPath = path.join(__dirname, 'app', 'layout.tsx');
  const staticLayoutPath = path.join(__dirname, 'app', 'static-layout.tsx');
  
  if (fs.existsSync(layoutPath)) {
    console.log('📁 Backing up layout.tsx...');
    fs.renameSync(layoutPath, layoutPath + '.backup');
    movedPaths.push({ 
      original: layoutPath, 
      backup: layoutPath + '.backup' 
    });
    
    console.log('📁 Using static layout for build...');
    fs.copyFileSync(staticLayoutPath, layoutPath);
  }

  // Copy the app-specific config
  const configPath = path.join(__dirname, 'next.config.mjs');
  const appConfigPath = path.join(__dirname, 'next.config.app.mjs');
  const originalConfig = fs.readFileSync(configPath, 'utf8');
  const appConfig = fs.readFileSync(appConfigPath, 'utf8');
  
  // Backup original config
  fs.writeFileSync(configPath + '.backup', originalConfig);
  
  // Use app-specific config
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
  
  // Restore original config
  const configPath = path.join(__dirname, 'next.config.mjs');
  const backupConfigPath = configPath + '.backup';
  if (fs.existsSync(backupConfigPath)) {
    console.log('🔄 Restoring original Next.js config...');
    fs.renameSync(backupConfigPath, configPath);
  }
}