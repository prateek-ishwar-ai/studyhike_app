import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Please check your .env file.')
  process.exit(1)
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  try {
    console.log('Applying homework policy fixes...')
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'scripts', 'fix-homework-policies.sql')
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      throw error
    }
    
    console.log('Homework policies successfully updated!')
  } catch (error) {
    console.error('Error applying homework policy fixes:', error)
    process.exit(1)
  }
}

main()