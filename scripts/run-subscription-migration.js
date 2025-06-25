// This script runs the SQL migration to set up subscription plans
// Run with: node scripts/run-subscription-migration.js <SUPABASE_URL> <SUPABASE_KEY>

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local file manually
let envVars = {};
try {
  const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      envVars[key] = value;
    }
  });
} catch (err) {
  console.warn('Warning: Could not read .env.local file');
}

// Get Supabase credentials from command line arguments or .env.local
const supabaseUrl = process.argv[2] || envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.argv[3] || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL and key not found!');
  console.error('Please provide them as command line arguments or in your .env.local file.');
  console.error('Usage: node scripts/run-subscription-migration.js [SUPABASE_URL] [SUPABASE_KEY]');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running migration to set up subscription plans...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240801000000_subscription_plans.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql });
    
    if (error) {
      console.error('Error running migration:', error);
      console.log('\nAlternative method:');
      console.log('1. Open the Supabase dashboard');
      console.log('2. Go to the SQL Editor');
      console.log('3. Copy and paste the contents of supabase/migrations/20240801000000_subscription_plans.sql');
      console.log('4. Run the SQL query manually');
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
    console.log('\nSubscription plans have been set up. You can now:');
    console.log('1. Restart your development server');
    console.log('2. Test the pricing page at /pricing');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

runMigration();