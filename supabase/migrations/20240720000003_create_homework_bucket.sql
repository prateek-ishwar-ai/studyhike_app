-- Create homework submissions bucket and policies

-- This is a SQL-only approach to create the bucket and policies
-- It doesn't rely on JavaScript or TypeScript code

-- Function to create the bucket if it doesn't exist
DO $$
DECLARE
  bucket_id UUID;
BEGIN
  -- Check if the bucket already exists
  SELECT id INTO bucket_id FROM storage.buckets WHERE name = 'homework-submissions';
  
  -- If the bucket doesn't exist, create it
  IF bucket_id IS NULL THEN
    INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public)
    VALUES (
      gen_random_uuid(),
      'homework-submissions',
      (SELECT id FROM auth.users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'),
      NOW(),
      NOW(),
      TRUE
    )
    RETURNING id INTO bucket_id;
    
    RAISE NOTICE 'Created homework-submissions bucket with ID %', bucket_id;
  ELSE
    -- Update the bucket to be public
    UPDATE storage.buckets SET public = TRUE WHERE id = bucket_id;
    RAISE NOTICE 'Bucket homework-submissions already exists with ID %, updated to public', bucket_id;
  END IF;
  
  -- Create policies for the bucket
  -- First, check if the policy already exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE bucket_id = bucket_id AND name = 'Public Access Policy'
  ) THEN
    -- Create a public access policy
    INSERT INTO storage.policies (id, name, bucket_id, definition)
    VALUES (
      gen_random_uuid(),
      'Public Access Policy',
      bucket_id,
      '{"role": "*", "permission": "ALL"}'::jsonb
    );
    
    RAISE NOTICE 'Created Public Access Policy for bucket homework-submissions';
  ELSE
    RAISE NOTICE 'Public Access Policy already exists for bucket homework-submissions';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating bucket or policies: %', SQLERRM;
END $$;