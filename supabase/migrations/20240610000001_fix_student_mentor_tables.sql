-- Fix student-mentor relationship tables

-- First, check if the assigned_students table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'assigned_students') THEN
    -- Create the assigned_students table
    CREATE TABLE public.assigned_students (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES public.profiles(id),
      mentor_id UUID NOT NULL REFERENCES public.profiles(id),
      assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(student_id, mentor_id)
    );

    -- Enable RLS
    ALTER TABLE public.assigned_students ENABLE ROW LEVEL SECURITY;

    -- Create policies
    -- Students can view their own assignments
    CREATE POLICY "Students can view their own assignments" 
    ON public.assigned_students 
    FOR SELECT 
    USING (auth.uid() = student_id);

    -- Mentors can view their assigned students
    CREATE POLICY "Mentors can view their assigned students" 
    ON public.assigned_students 
    FOR SELECT 
    USING (auth.uid() = mentor_id);

    -- Admin can view and manage all assignments
    CREATE POLICY "Admin can manage all assignments" 
    ON public.assigned_students 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
  END IF;

  -- Now, migrate data from student_mentor_assignments if it exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_mentor_assignments') THEN
    -- Insert data from student_mentor_assignments to assigned_students if not already there
    INSERT INTO public.assigned_students (student_id, mentor_id, assigned_at)
    SELECT sma.student_id, sma.mentor_id, sma.assigned_at
    FROM public.student_mentor_assignments sma
    WHERE NOT EXISTS (
      SELECT 1 FROM public.assigned_students as2
      WHERE as2.student_id = sma.student_id AND as2.mentor_id = sma.mentor_id
    );
  END IF;
END
$$;