// This script fixes the homework submission storage issues
// Run with: node scripts/fix-homework-storage.js

const { createClient } = require('@supabase/supabase-js');

// Hardcode Supabase credentials for this script
// Replace these with your actual Supabase URL and anon key
const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseKey = 'your-anon-key';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixHomeworkStorage() {
  console.log('Starting homework storage fix...');

  try {
    // 1. Check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Error listing buckets: ${bucketsError.message}`);
    }
    
    const homeworkBucket = buckets.find(b => b.name === 'homework-submissions');
    
    // 2. Create the bucket if it doesn't exist
    if (!homeworkBucket) {
      console.log('Creating homework-submissions bucket...');
      
      const { data, error } = await supabase.storage.createBucket('homework-submissions', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      });
      
      if (error) {
        throw new Error(`Error creating bucket: ${error.message}`);
      }
      
      console.log('Bucket created successfully!');
    } else {
      console.log('Homework-submissions bucket already exists.');
    }
    
    // 3. Create policies for the bucket
    console.log('Creating storage policies...');
    
    // Policy for students to upload their own files
    const { error: policyError1 } = await supabase.storage.from('homework-submissions')
      .createPolicy('Students can upload homework files', {
        name: 'Students can upload homework files',
        definition: {
          role: 'authenticated',
          permission: 'INSERT',
          check: "((storage.foldername(name))[1] = auth.uid()::text)"
        }
      });
    
    if (policyError1) {
      console.warn(`Warning creating upload policy: ${policyError1.message}`);
    } else {
      console.log('Upload policy created successfully!');
    }
    
    // Policy for students to read their own files
    const { error: policyError2 } = await supabase.storage.from('homework-submissions')
      .createPolicy('Students can read their own homework files', {
        name: 'Students can read their own homework files',
        definition: {
          role: 'authenticated',
          permission: 'SELECT',
          check: "((storage.foldername(name))[1] = auth.uid()::text)"
        }
      });
    
    if (policyError2) {
      console.warn(`Warning creating read policy: ${policyError2.message}`);
    } else {
      console.log('Read policy created successfully!');
    }
    
    // Policy for admins to manage all files
    const { error: policyError3 } = await supabase.storage.from('homework-submissions')
      .createPolicy('Admins can manage all homework files', {
        name: 'Admins can manage all homework files',
        definition: {
          role: 'authenticated',
          permission: 'ALL',
          check: "EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')"
        }
      });
    
    if (policyError3) {
      console.warn(`Warning creating admin policy: ${policyError3.message}`);
    } else {
      console.log('Admin policy created successfully!');
    }
    
    console.log('Homework storage fix completed successfully!');
  } catch (error) {
    console.error('Error fixing homework storage:', error);
    process.exit(1);
  }
}

fixHomeworkStorage();