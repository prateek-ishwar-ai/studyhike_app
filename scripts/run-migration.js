// This script runs the SQL migration to create the homework bucket
// Run with: node scripts/run-migration.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get Supabase credentials from command line arguments
const supabaseUrl = process.argv[2];
const supabaseKey = process.argv[3];

if (!supabaseUrl || !supabaseKey) {
  console.error('Usage: node scripts/run-migration.js <SUPABASE_URL> <SUPABASE_KEY>');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running migration to create homework bucket...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240720000003_create_homework_bucket.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql });
    
    if (error) {
      console.error('Error running migration:', error);
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
    
    // Now try to create the bucket using the storage API as a fallback
    try {
      const { data, error } = await supabase.storage.createBucket('homework-submissions', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      });
      
      if (error && !error.message.includes('already exists')) {
        console.warn('Warning creating bucket via API:', error);
      } else if (!error) {
        console.log('Bucket created successfully via API!');
      } else {
        console.log('Bucket already exists.');
      }
    } catch (apiError) {
      console.warn('Warning trying API method:', apiError);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

runMigration();