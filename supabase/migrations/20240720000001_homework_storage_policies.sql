-- Create storage policies for homework submissions

-- Create policy to allow students to upload their own homework files
BEGIN;

-- First, check if the bucket exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'homework-submissions'
  ) THEN
    -- Create policy for students to upload files
    INSERT INTO storage.policies (name, bucket_id, definition)
    SELECT 
      'Students can upload homework files',
      id,
      '{"role": "authenticated", "permission": "INSERT", "check": "((storage.foldername(name))[1] = auth.uid()::text)"}'::jsonb
    FROM storage.buckets
    WHERE name = 'homework-submissions'
    AND NOT EXISTS (
      SELECT 1 FROM storage.policies 
      WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'homework-submissions')
      AND name = 'Students can upload homework files'
    );

    -- Create policy for students to read their own files
    INSERT INTO storage.policies (name, bucket_id, definition)
    SELECT 
      'Students can read their own homework files',
      id,
      '{"role": "authenticated", "permission": "SELECT", "check": "((storage.foldername(name))[1] = auth.uid()::text)"}'::jsonb
    FROM storage.buckets
    WHERE name = 'homework-submissions'
    AND NOT EXISTS (
      SELECT 1 FROM storage.policies 
      WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'homework-submissions')
      AND name = 'Students can read their own homework files'
    );

    -- Create policy for mentors to read their students' files
    INSERT INTO storage.policies (name, bucket_id, definition)
    SELECT 
      'Mentors can read their students homework files',
      id,
      '{"role": "authenticated", "permission": "SELECT", "check": "EXISTS (SELECT 1 FROM public.student_mentor_assignments sma WHERE sma.mentor_id = auth.uid() AND sma.student_id::text = (storage.foldername(name))[1])"}'::jsonb
    FROM storage.buckets
    WHERE name = 'homework-submissions'
    AND NOT EXISTS (
      SELECT 1 FROM storage.policies 
      WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'homework-submissions')
      AND name = 'Mentors can read their students homework files'
    );

    -- Create policy for admins to manage all files
    INSERT INTO storage.policies (name, bucket_id, definition)
    SELECT 
      'Admins can manage all homework files',
      id,
      '{"role": "authenticated", "permission": "ALL", "check": "EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = ''admin'')"}'::jsonb
    FROM storage.buckets
    WHERE name = 'homework-submissions'
    AND NOT EXISTS (
      SELECT 1 FROM storage.policies 
      WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = 'homework-submissions')
      AND name = 'Admins can manage all homework files'
    );
  END IF;
END $$;

COMMIT;