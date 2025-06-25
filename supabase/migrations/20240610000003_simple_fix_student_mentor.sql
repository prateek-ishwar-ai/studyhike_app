-- Simple fix for student-mentor relationship

-- Create assigned_students table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.assigned_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  mentor_id UUID NOT NULL REFERENCES public.profiles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, mentor_id)
);

-- Enable RLS if not already enabled
ALTER TABLE public.assigned_students ENABLE ROW LEVEL SECURITY;

-- Create policies (these will fail silently if they already exist)
DO $$ 
BEGIN
  BEGIN
    CREATE POLICY "Students can view their own assignments" 
    ON public.assigned_students 
    FOR SELECT 
    USING (auth.uid() = student_id);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists, do nothing
  END;

  BEGIN
    CREATE POLICY "Mentors can view their assigned students" 
    ON public.assigned_students 
    FOR SELECT 
    USING (auth.uid() = mentor_id);
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists, do nothing
  END;

  BEGIN
    CREATE POLICY "Admin can manage all assignments" 
    ON public.assigned_students 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  EXCEPTION WHEN duplicate_object THEN
    -- Policy already exists, do nothing
  END;
END $$;

-- Migrate data from student_mentor_assignments if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_mentor_assignments') THEN
    INSERT INTO public.assigned_students (student_id, mentor_id, assigned_at)
    SELECT sma.student_id, sma.mentor_id, sma.assigned_at
    FROM public.student_mentor_assignments sma
    WHERE NOT EXISTS (
      SELECT 1 FROM public.assigned_students as2
      WHERE as2.student_id = sma.student_id AND as2.mentor_id = sma.mentor_id
    );
  END IF;
END $$;