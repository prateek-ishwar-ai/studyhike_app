-- Simple fix for meeting_requests table

-- Add mentor_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'meeting_requests' 
                AND column_name = 'mentor_id') THEN
    ALTER TABLE public.meeting_requests ADD COLUMN mentor_id UUID REFERENCES public.profiles(id);
  END IF;
END $$;

-- Update status check constraint
ALTER TABLE public.meeting_requests DROP CONSTRAINT IF EXISTS meeting_requests_status_check;
ALTER TABLE public.meeting_requests ADD CONSTRAINT meeting_requests_status_check 
  CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed'));

-- Update preferred_time to be TEXT if it's not already
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_requests' 
    AND column_name = 'preferred_time'
    AND data_type != 'text'
  ) THEN
    ALTER TABLE public.meeting_requests ALTER COLUMN preferred_time TYPE TEXT USING preferred_time::TEXT;
  END IF;
END $$;

-- Create a simple function for creating the meeting_requests table
CREATE OR REPLACE FUNCTION public.create_meeting_requests_table()
RETURNS boolean AS $func$
BEGIN
  -- This function is now just a placeholder
  RETURN true;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;