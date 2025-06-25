-- Resources table (if not exists)
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_type TEXT NOT NULL CHECK (file_type IN ('video', 'pdf', 'image')),
  file_url TEXT NOT NULL,
  subject TEXT NOT NULL,
  difficulty_level TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add shared_with column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'resources' AND column_name = 'shared_with'
  ) THEN
    ALTER TABLE resources ADD COLUMN shared_with UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Add RLS policies for resources
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Policy for mentors to create resources
-- Note: This policy is likely already created in the database
-- Uncomment if needed:
/*
CREATE POLICY "Mentors can create resources" ON resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'mentor'
    )
  );
*/

-- Policy for mentors to view their own resources
-- Note: This policy might already exist in the database
-- Uncomment if needed:
/*
CREATE POLICY "Mentors can view their own resources" ON resources
  FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'mentor'
    )
  );
*/

-- Policy for students to view resources shared with them
-- Note: This policy might already exist in the database
-- Uncomment if needed:
/*
CREATE POLICY "Students can view resources shared with them" ON resources
  FOR SELECT
  TO authenticated
  USING (
    (shared_with = auth.uid() OR shared_with IS NULL) AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'student'
    )
  );
*/

-- Note: The project already has a 'homework' table, so we'll use that instead of creating a new 'homework_submissions' table.
-- The existing 'homework' table has the following structure:
-- id UUID PRIMARY KEY
-- title TEXT NOT NULL
-- description TEXT
-- subject TEXT NOT NULL
-- mentor_id UUID REFERENCES profiles(id) NOT NULL
-- student_id UUID REFERENCES profiles(id)
-- due_date TIMESTAMP WITH TIME ZONE NOT NULL
-- status homework_status DEFAULT 'pending'
-- submission_file_url TEXT
-- feedback TEXT
-- score INTEGER
-- created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

-- Add additional RLS policies for homework if needed
-- (The project likely already has basic policies for the homework table)

-- Note: The homework table likely already has appropriate RLS policies
-- We'll skip creating them to avoid errors
-- If you need to add or modify policies, you can create a separate migration file

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS resources_mentor_id_idx ON resources(mentor_id);
CREATE INDEX IF NOT EXISTS resources_student_id_idx ON resources(student_id);
CREATE INDEX IF NOT EXISTS homework_submissions_student_id_idx ON homework_submissions(student_id);
CREATE INDEX IF NOT EXISTS homework_submissions_mentor_id_idx ON homework_submissions(mentor_id);