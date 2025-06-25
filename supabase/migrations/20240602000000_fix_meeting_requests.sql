-- This migration fixes any issues with the meeting_requests table and its permissions

-- First, let's make sure the table has the correct structure
DO $migration_block$
BEGIN
    -- Add any missing columns
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'meeting_requests') THEN
        -- Add student_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'meeting_requests' 
            AND column_name = 'student_id'
        ) THEN
            ALTER TABLE meeting_requests ADD COLUMN student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added student_id column';
        END IF;
        
        -- Add mentor_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'meeting_requests' 
            AND column_name = 'mentor_id'
        ) THEN
            ALTER TABLE meeting_requests ADD COLUMN mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added mentor_id column';
        END IF;
        
        -- Add requested_day column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'meeting_requests' 
            AND column_name = 'requested_day'
        ) THEN
            ALTER TABLE meeting_requests ADD COLUMN requested_day DATE;
            RAISE NOTICE 'Added requested_day column';
        END IF;
        
        -- Add requested_time column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'meeting_requests' 
            AND column_name = 'requested_time'
        ) THEN
            ALTER TABLE meeting_requests ADD COLUMN requested_time TIME;
            RAISE NOTICE 'Added requested_time column';
        END IF;
        
        -- Add topic column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'meeting_requests' 
            AND column_name = 'topic'
        ) THEN
            ALTER TABLE meeting_requests ADD COLUMN topic TEXT;
            RAISE NOTICE 'Added topic column';
        END IF;
        
        -- Add status column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'meeting_requests' 
            AND column_name = 'status'
        ) THEN
            ALTER TABLE meeting_requests ADD COLUMN status TEXT DEFAULT 'pending';
            RAISE NOTICE 'Added status column';
        END IF;
        
        -- Add confirmed_time column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'meeting_requests' 
            AND column_name = 'confirmed_time'
        ) THEN
            ALTER TABLE meeting_requests ADD COLUMN confirmed_time TIME;
            RAISE NOTICE 'Added confirmed_time column';
        END IF;
        
        -- Add confirmed_day column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'meeting_requests' 
            AND column_name = 'confirmed_day'
        ) THEN
            ALTER TABLE meeting_requests ADD COLUMN confirmed_day DATE;
            RAISE NOTICE 'Added confirmed_day column';
        END IF;
        
        -- Add meet_link column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'meeting_requests' 
            AND column_name = 'meet_link'
        ) THEN
            ALTER TABLE meeting_requests ADD COLUMN meet_link TEXT;
            RAISE NOTICE 'Added meet_link column';
        END IF;
    ELSE
        -- Create the table if it doesn't exist
        CREATE TABLE meeting_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          mentor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          requested_day DATE NOT NULL,
          requested_time TIME NOT NULL,
          topic TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | rejected
          confirmed_time TIME, -- final confirmed time by mentor
          confirmed_day DATE, -- optional if mentor wants to reschedule
          meet_link TEXT, -- Google Meet or Zoom link
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        RAISE NOTICE 'Created meeting_requests table';
    END IF;
END;
$migration_block$;

-- Now, let's fix the RLS policies
-- First, enable RLS
ALTER TABLE meeting_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Students can view their own meeting requests" ON meeting_requests;
DROP POLICY IF EXISTS "Students can create meeting requests" ON meeting_requests;
DROP POLICY IF EXISTS "Mentors can view meeting requests assigned to them" ON meeting_requests;
DROP POLICY IF EXISTS "Mentors can update meeting requests assigned to them" ON meeting_requests;

-- Create new policies with simpler conditions
-- Students can view their own meeting requests
CREATE POLICY "Students can view their own meeting requests"
  ON meeting_requests
  FOR SELECT
  USING (auth.uid() = student_id);

-- Students can create meeting requests
CREATE POLICY "Students can create meeting requests"
  ON meeting_requests
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Mentors can view meeting requests assigned to them
CREATE POLICY "Mentors can view meeting requests assigned to them"
  ON meeting_requests
  FOR SELECT
  USING (auth.uid() = mentor_id);

-- Mentors can update meeting requests assigned to them
CREATE POLICY "Mentors can update meeting requests assigned to them"
  ON meeting_requests
  FOR UPDATE
  USING (auth.uid() = mentor_id);

-- Create a policy for everyone to be able to insert (for testing)
CREATE POLICY "Anyone can insert meeting requests"
  ON meeting_requests
  FOR INSERT
  WITH CHECK (true);

-- Create a policy for everyone to be able to select (for testing)
CREATE POLICY "Anyone can select meeting requests"
  ON meeting_requests
  FOR SELECT
  USING (true);

-- Create a function to check update permission
CREATE OR REPLACE FUNCTION public.check_update_permission(record_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM meeting_requests
    WHERE id = record_id AND (
      auth.uid() = student_id OR
      auth.uid() = mentor_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;