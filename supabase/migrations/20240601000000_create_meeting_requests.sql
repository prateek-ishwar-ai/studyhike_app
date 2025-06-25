-- Check if meeting_requests table exists and add missing columns if needed
DO $migration_block$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'meeting_requests') THEN
        -- Create meeting_requests table
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
    ELSE
        -- Table already exists, let's make sure it has all the columns we need
        RAISE NOTICE 'Table meeting_requests already exists, checking columns...';
        
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
        
        -- Add updated_at column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'meeting_requests' 
            AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE meeting_requests ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
            RAISE NOTICE 'Added updated_at column';
        END IF;
    END IF;
END;
$migration_block$;

-- Create function to update updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $update_trigger$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$update_trigger$ LANGUAGE plpgsql;

-- Enable RLS and create policies
DO $policy_block$
DECLARE
    student_id_exists BOOLEAN;
    mentor_id_exists BOOLEAN;
BEGIN
    -- Check if required columns exist
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'meeting_requests' 
        AND column_name = 'student_id'
    ) INTO student_id_exists;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'meeting_requests' 
        AND column_name = 'mentor_id'
    ) INTO mentor_id_exists;
    
    -- Only proceed if both columns exist
    IF student_id_exists AND mentor_id_exists THEN
        -- Enable RLS on the table
        ALTER TABLE meeting_requests ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies to avoid conflicts
        DROP POLICY IF EXISTS "Students can view their own meeting requests" ON meeting_requests;
        DROP POLICY IF EXISTS "Students can create meeting requests" ON meeting_requests;
        DROP POLICY IF EXISTS "Mentors can view meeting requests assigned to them" ON meeting_requests;
        DROP POLICY IF EXISTS "Mentors can update meeting requests assigned to them" ON meeting_requests;
        
        -- Create policies
        CREATE POLICY "Students can view their own meeting requests"
          ON meeting_requests
          FOR SELECT
          USING (auth.uid() = student_id);
          
        CREATE POLICY "Students can create meeting requests"
          ON meeting_requests
          FOR INSERT
          WITH CHECK (auth.uid() = student_id);
          
        CREATE POLICY "Mentors can view meeting requests assigned to them"
          ON meeting_requests
          FOR SELECT
          USING (auth.uid() = mentor_id);
          
        CREATE POLICY "Mentors can update meeting requests assigned to them"
          ON meeting_requests
          FOR UPDATE
          USING (auth.uid() = mentor_id);
          
        RAISE NOTICE 'Created RLS policies for meeting_requests table';
    ELSE
        RAISE NOTICE 'Cannot create RLS policies: student_id or mentor_id column missing';
    END IF;
END;
$policy_block$;

-- Create trigger to update updated_at timestamp
DO $trigger_block$
DECLARE
    updated_at_exists BOOLEAN;
BEGIN
    -- Check if updated_at column exists
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'meeting_requests' 
        AND column_name = 'updated_at'
    ) INTO updated_at_exists;
    
    -- Only create trigger if updated_at column exists
    IF updated_at_exists THEN
        DROP TRIGGER IF EXISTS update_meeting_requests_updated_at ON meeting_requests;
        CREATE TRIGGER update_meeting_requests_updated_at
        BEFORE UPDATE ON meeting_requests
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
        
        RAISE NOTICE 'Created update_meeting_requests_updated_at trigger';
    ELSE
        RAISE NOTICE 'Cannot create trigger: updated_at column missing';
    END IF;
END;
$trigger_block$;