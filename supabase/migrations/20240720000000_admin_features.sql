-- Create meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id),
  mentor_id UUID REFERENCES public.profiles(id),
  meeting_time TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  type TEXT CHECK (type IN ('auto', 'on-request')),
  join_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on meetings table
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Create policies for meetings table
-- Students can view their own meetings
CREATE POLICY "Students can view their own meetings"
ON public.meetings
FOR SELECT
USING (auth.uid() = student_id);

-- Mentors can view meetings they're assigned to
CREATE POLICY "Mentors can view their assigned meetings"
ON public.meetings
FOR SELECT
USING (auth.uid() = mentor_id);

-- Mentors can update meetings they're assigned to
CREATE POLICY "Mentors can update their assigned meetings"
ON public.meetings
FOR UPDATE
USING (auth.uid() = mentor_id);

-- Admin can view all meetings
CREATE POLICY "Admin can view all meetings"
ON public.meetings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Admin can update all meetings
CREATE POLICY "Admin can update all meetings"
ON public.meetings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Admin can insert meetings
CREATE POLICY "Admin can insert meetings"
ON public.meetings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Create progress_reports table
CREATE TABLE IF NOT EXISTS public.progress_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.profiles(id),
  subject TEXT NOT NULL,
  total_tests INTEGER DEFAULT 0,
  average_score INTEGER DEFAULT 0,
  completed_homework INTEGER DEFAULT 0,
  mentor_feedback TEXT,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on progress_reports table
ALTER TABLE public.progress_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for progress_reports table
-- Students can view their own progress reports
CREATE POLICY "Students can view their own progress reports"
ON public.progress_reports
FOR SELECT
USING (auth.uid() = student_id);

-- Mentors can view progress reports for their students
CREATE POLICY "Mentors can view their students' progress reports"
ON public.progress_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assigned_students a
    WHERE a.mentor_id = auth.uid() AND a.student_id = student_id
  )
);

-- Mentors can update progress reports for their students
CREATE POLICY "Mentors can update their students' progress reports"
ON public.progress_reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.assigned_students a
    WHERE a.mentor_id = auth.uid() AND a.student_id = student_id
  )
);

-- Admin can view all progress reports
CREATE POLICY "Admin can view all progress reports"
ON public.progress_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Admin can update all progress reports
CREATE POLICY "Admin can update all progress reports"
ON public.progress_reports
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Admin can insert progress reports
CREATE POLICY "Admin can insert progress reports"
ON public.progress_reports
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles u 
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- Ensure role column exists in profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT CHECK (role IN ('admin', 'mentor', 'student'));

-- Create function to auto-schedule meetings on first login
CREATE OR REPLACE FUNCTION public.auto_schedule_meetings()
RETURNS TRIGGER AS $$
DECLARE
  mentor_id UUID;
  meeting_date TIMESTAMPTZ;
  i INTEGER;
BEGIN
  -- Only proceed if this is a student
  IF NEW.role = 'student' THEN
    -- Check if student already has meetings
    IF EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE student_id = NEW.id
    ) THEN
      RETURN NEW;
    END IF;
    
    -- Get assigned mentor for this student
    SELECT a.mentor_id INTO mentor_id
    FROM public.assigned_students a
    WHERE a.student_id = NEW.id
    LIMIT 1;
    
    -- If no mentor assigned, exit
    IF mentor_id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Schedule 8 meetings, one every 3-4 days
    FOR i IN 1..8 LOOP
      meeting_date := NOW() + ((i * 3) || ' days')::INTERVAL;
      
      -- Set meeting time to 3:00 PM
      meeting_date := DATE_TRUNC('day', meeting_date) + '15:00:00'::INTERVAL;
      
      INSERT INTO public.meetings (
        student_id,
        mentor_id,
        meeting_time,
        status,
        type,
        join_url
      ) VALUES (
        NEW.id,
        mentor_id,
        meeting_date,
        'scheduled',
        'auto',
        'https://meet.google.com/auto-' || SUBSTRING(NEW.id::TEXT, 1, 4) || '-' || i
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-scheduling meetings
DROP TRIGGER IF EXISTS auto_schedule_meetings_trigger ON public.profiles;
CREATE TRIGGER auto_schedule_meetings_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_schedule_meetings();