// This script extracts the SQL content from the migration file
// Run with: node scripts/extract-sql.js

const fs = require('fs');
const path = require('path');

try {
  console.log('Extracting SQL content from migration file...');
  
  // Read the SQL file
  const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240801000000_subscription_plans.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  // Write to a new file in the root directory
  const outputPath = path.join(__dirname, '..', 'subscription_plans.sql');
  fs.writeFileSync(outputPath, sql);
  
  console.log(`SQL content extracted to: ${outputPath}`);
  console.log('\nInstructions:');
  console.log('1. Open the Supabase dashboard');
  console.log('2. Go to the SQL Editor');
  console.log('3. Copy and paste the contents of subscription_plans.sql');
  console.log('4. Run the SQL query manually');
} catch (error) {
  console.error('Error extracting SQL content:', error);
  process.exit(1);
}