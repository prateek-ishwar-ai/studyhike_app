// This script runs the database setup
// Run this script with: node scripts/run-setup.js

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local file not found.');
  console.error('Please create a .env.local file with your Supabase credentials:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key (optional)');
  process.exit(1);
}

// Run the setup script
console.log('Running database setup...');
const setupScript = path.join(__dirname, 'setup-database.js');
const child = exec(`node ${setupScript}`, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
    return;
  }
  console.log(stdout);
});

child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

child.on('exit', (code) => {
  console.log(`Database setup exited with code ${code}`);
  if (code === 0) {
    console.log('Database setup completed successfully!');
    console.log('You can now restart your Next.js server and try assigning students to mentors.');
  } else {
    console.error('Database setup failed. Please check the error messages above.');
  }
});