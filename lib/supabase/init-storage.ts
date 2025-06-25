import { createClient } from '@supabase/supabase-js';

// This script is meant to be run once to set up the storage buckets
// You can run it with `ts-node lib/supabase/init-storage.ts`

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBuckets() {
  try {
    // Create homework submissions bucket
    const { data: homeworkBucket, error: homeworkError } = await supabase.storage.createBucket(
      'homework_submissions',
      {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      }
    );

    if (homeworkError) {
      if (homeworkError.message.includes('already exists')) {
        console.log('Homework submissions bucket already exists');
      } else {
        throw homeworkError;
      }
    } else {
      console.log('Created homework submissions bucket:', homeworkBucket);
    }

    // Create resources bucket
    const { data: resourcesBucket, error: resourcesError } = await supabase.storage.createBucket(
      'learning_resources',
      {
        public: true,
        fileSizeLimit: 104857600, // 100MB
        allowedMimeTypes: [
          'application/pdf', 
          'image/jpeg', 
          'image/png', 
          'image/jpg',
          'video/mp4', 
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
      }
    );

    if (resourcesError) {
      if (resourcesError.message.includes('already exists')) {
        console.log('Learning resources bucket already exists');
      } else {
        throw resourcesError;
      }
    } else {
      console.log('Created learning resources bucket:', resourcesBucket);
    }

    // Create profile photos bucket
    const { data: profileBucket, error: profileError } = await supabase.storage.createBucket(
      'profile_photos',
      {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg']
      }
    );

    if (profileError) {
      if (profileError.message.includes('already exists')) {
        console.log('Profile photos bucket already exists');
      } else {
        throw profileError;
      }
    } else {
      console.log('Created profile photos bucket:', profileBucket);
    }

    // Create public policy for learning resources bucket
    const { error: policyError } = await supabase.storage.from('learning_resources').createPolicy('public-read', {
      name: 'public-read',
      definition: {
        role: { eq: 'authenticated' },
        operation: { eq: 'SELECT' }
      }
    });

    if (policyError && !policyError.message.includes('already exists')) {
      throw policyError;
    }

    console.log('Storage buckets setup complete!');
  } catch (error) {
    console.error('Error setting up storage buckets:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  createBuckets()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { createBuckets };