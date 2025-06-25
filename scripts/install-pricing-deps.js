/**
 * Script to install dependencies required for the pricing implementation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define the dependencies to install
const dependencies = [
  'razorpay@^2.9.2',
  'resend@^2.0.0'
];

console.log('Installing dependencies for StudyHike pricing implementation...');

try {
  // Check if package.json exists
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('Error: package.json not found!');
    process.exit(1);
  }

  // Install dependencies
  console.log(`Installing: ${dependencies.join(', ')}`);
  execSync(`npm install ${dependencies.join(' ')}`, { stdio: 'inherit' });

  console.log('\nDependencies installed successfully!');
  console.log('\nNext steps:');
  console.log('1. Run the database migration: node scripts/run-migration.js');
  console.log('2. Set up Razorpay API keys in your environment variables:');
  console.log('   - RAZORPAY_KEY_ID');
  console.log('   - RAZORPAY_KEY_SECRET');
  console.log('3. Restart your development server');
} catch (error) {
  console.error('Error installing dependencies:', error.message);
  process.exit(1);
}