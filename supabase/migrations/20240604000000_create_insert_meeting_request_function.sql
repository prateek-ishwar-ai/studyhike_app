-- Create a function to insert meeting requests that bypasses RLS

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.insert_meeting_request;

-- Create the function
CREATE OR REPLACE FUNCTION public.insert_meeting_request(
  p_student_id UUID,
  p_mentor_id UUID,
  p_requested_day DATE,
  p_requested_time TIME,
  p_topic TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Validate inputs
  IF p_student_id IS NULL OR p_mentor_id IS NULL OR p_requested_day IS NULL OR p_requested_time IS NULL OR p_topic IS NULL THEN
    RAISE EXCEPTION 'All parameters are required';
  END IF;
  
  -- Check if the student exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_student_id) THEN
    RAISE EXCEPTION 'Student ID does not exist';
  END IF;
  
  -- Check if the mentor exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_mentor_id) THEN
    RAISE EXCEPTION 'Mentor ID does not exist';
  END IF;
  
  -- Insert the meeting request
  INSERT INTO public.meeting_requests (
    student_id,
    mentor_id,
    requested_day,
    requested_time,
    topic,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_student_id,
    p_mentor_id,
    p_requested_day,
    p_requested_time,
    p_topic,
    'pending',
    now(),
    now()
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;