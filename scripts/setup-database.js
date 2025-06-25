// This script sets up all the necessary tables in Supabase
// Run this script with: node scripts/setup-database.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL and Service Role Key are required.');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
  process.exit(1);
}

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL to create the student_mentor_assignments table
const createStudentMentorAssignmentsTable = `
-- Create the student_mentor_assignments table
CREATE TABLE IF NOT EXISTS public.student_mentor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  mentor_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, mentor_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_mentor_assignments_student_id 
ON public.student_mentor_assignments(student_id);

CREATE INDEX IF NOT EXISTS idx_student_mentor_assignments_mentor_id 
ON public.student_mentor_assignments(mentor_id);

-- Enable RLS
ALTER TABLE public.student_mentor_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admin can do everything
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_mentor_assignments' 
    AND policyname = 'Admin can manage all assignments'
  ) THEN
    CREATE POLICY "Admin can manage all assignments" 
    ON public.student_mentor_assignments 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles u 
        WHERE u.id = auth.uid() AND u.role = 'admin'
      )
    );
  END IF;
END
$$;

-- Mentors can view their own assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_mentor_assignments' 
    AND policyname = 'Mentors can view their own assignments'
  ) THEN
    CREATE POLICY "Mentors can view their own assignments" 
    ON public.student_mentor_assignments 
    FOR SELECT 
    USING (mentor_id = auth.uid());
  END IF;
END
$$;

-- Students can view their own assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'student_mentor_assignments' 
    AND policyname = 'Students can view their own assignments'
  ) THEN
    CREATE POLICY "Students can view their own assignments" 
    ON public.student_mentor_assignments 
    FOR SELECT 
    USING (student_id = auth.uid());
  END IF;
END
$$;
`;

// SQL to create the mentor_meeting_requests table
const createMentorMeetingRequestsTable = `
-- Create the mentor_meeting_requests table
CREATE TABLE IF NOT EXISTS public.mentor_meeting_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id UUID NOT NULL,
  student_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  proposed_date DATE NOT NULL,
  proposed_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  student_response TEXT,
  meeting_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_mentor_meeting_requests_mentor_id 
ON public.mentor_meeting_requests(mentor_id);

CREATE INDEX IF NOT EXISTS idx_mentor_meeting_requests_student_id 
ON public.mentor_meeting_requests(student_id);

CREATE INDEX IF NOT EXISTS idx_mentor_meeting_requests_status 
ON public.mentor_meeting_requests(status);

-- Enable RLS
ALTER TABLE public.mentor_meeting_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admin can do everything
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mentor_meeting_requests' 
    AND policyname = 'Admin can manage all meeting requests'
  ) THEN
    CREATE POLICY "Admin can manage all meeting requests" 
    ON public.mentor_meeting_requests 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles u 
        WHERE u.id = auth.uid() AND u.role = 'admin'
      )
    );
  END IF;
END
$$;

-- Mentors can manage their own meeting requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mentor_meeting_requests' 
    AND policyname = 'Mentors can manage their own meeting requests'
  ) THEN
    CREATE POLICY "Mentors can manage their own meeting requests" 
    ON public.mentor_meeting_requests 
    FOR ALL 
    USING (mentor_id = auth.uid());
  END IF;
END
$$;

-- Students can view meeting requests for them
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mentor_meeting_requests' 
    AND policyname = 'Students can view their meeting requests'
  ) THEN
    CREATE POLICY "Students can view their meeting requests" 
    ON public.mentor_meeting_requests 
    FOR SELECT 
    USING (student_id = auth.uid());
  END IF;
END
$$;

-- Students can update meeting requests to respond
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'mentor_meeting_requests' 
    AND policyname = 'Students can respond to meeting requests'
  ) THEN
    CREATE POLICY "Students can respond to meeting requests" 
    ON public.mentor_meeting_requests 
    FOR UPDATE 
    USING (student_id = auth.uid())
    WITH CHECK (
      student_id = auth.uid() AND 
      (status = 'pending' OR status = 'accepted')
    );
  END IF;
END
$$;
`;

// SQL to create the exec_sql function
const createExecSqlFunction = `
-- Create a function to execute arbitrary SQL (for admin use only)
CREATE OR REPLACE FUNCTION public.exec_sql(sql_string text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Check if the user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can execute arbitrary SQL';
  END IF;

  -- Execute the SQL and capture the result
  EXECUTE sql_string INTO result;
  RETURN result;
EXCEPTION
  WHEN others THEN
    -- Return the error message
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Set the security for the function
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
`;

// SQL to create the assign_student_to_mentor function
const createAssignStudentFunction = `
-- Create a function to assign a student to a mentor
CREATE OR REPLACE FUNCTION public.assign_student_to_mentor(
  p_student_id UUID,
  p_mentor_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Check if the user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can assign students to mentors';
  END IF;

  -- Check if the student exists
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_student_id AND role = 'student'
  ) THEN
    RAISE EXCEPTION 'Student with ID % not found', p_student_id;
  END IF;

  -- Check if the mentor exists
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = p_mentor_id AND role = 'mentor'
  ) THEN
    RAISE EXCEPTION 'Mentor with ID % not found', p_mentor_id;
  END IF;

  -- Check if the assignment already exists
  IF EXISTS (
    SELECT 1 FROM public.student_mentor_assignments 
    WHERE student_id = p_student_id AND mentor_id = p_mentor_id
  ) THEN
    RAISE EXCEPTION 'This student is already assigned to this mentor';
  END IF;

  -- Insert the assignment
  INSERT INTO public.student_mentor_assignments (student_id, mentor_id)
  VALUES (p_student_id, p_mentor_id)
  RETURNING id INTO v_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Student assigned to mentor successfully',
    'id', v_id
  );
EXCEPTION
  WHEN others THEN
    -- Return the error message
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;

-- Set the security for the function
REVOKE ALL ON FUNCTION public.assign_student_to_mentor(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_student_to_mentor(UUID, UUID) TO authenticated;
`;

// SQL to create the remove_student_assignment function
const createRemoveAssignmentFunction = `
-- Create a function to remove a student assignment
CREATE OR REPLACE FUNCTION public.remove_student_assignment(
  p_assignment_id UUID
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if the user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only admins can remove student assignments';
  END IF;

  -- Check if the assignment exists
  SELECT EXISTS (
    SELECT 1 FROM public.student_mentor_assignments 
    WHERE id = p_assignment_id
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'Assignment with ID % not found', p_assignment_id;
  END IF;

  -- Delete the assignment
  DELETE FROM public.student_mentor_assignments 
  WHERE id = p_assignment_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Student assignment removed successfully'
  );
EXCEPTION
  WHEN others THEN
    -- Return the error message
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;

-- Set the security for the function
REVOKE ALL ON FUNCTION public.remove_student_assignment(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_student_assignment(UUID) TO authenticated;
`;

// SQL to create the get_mentor_students function
const createGetMentorStudentsFunction = `
-- Create a function to get all students assigned to a mentor
CREATE OR REPLACE FUNCTION public.get_mentor_students(
  p_mentor_id UUID DEFAULT auth.uid()
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  -- Check if the user is authorized (admin or the mentor themselves)
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) OR auth.uid() = p_mentor_id
  ) THEN
    RAISE EXCEPTION 'Permission denied: You can only view your own students or you must be an admin';
  END IF;

  -- Get all students assigned to this mentor with their profile information
  SELECT json_agg(
    json_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'email', p.email,
      'current_class', p.current_class,
      'target_exam', p.target_exam,
      'status', p.status,
      'created_at', p.created_at,
      'assigned_at', a.assigned_at,
      'assignment_id', a.id
    )
  )
  INTO v_result
  FROM public.student_mentor_assignments a
  JOIN public.profiles p ON a.student_id = p.id
  WHERE a.mentor_id = p_mentor_id;

  -- Return the result
  RETURN COALESCE(v_result, '[]'::json);
EXCEPTION
  WHEN others THEN
    -- Return the error message
    RETURN json_build_object(
      'error', SQLERRM
    );
END;
$$;

-- Set the security for the function
REVOKE ALL ON FUNCTION public.get_mentor_students(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_mentor_students(UUID) TO authenticated;
`;

// Main function to set up the database
async function setupDatabase() {
  console.log('Setting up database...');

  try {
    // Create the exec_sql function first
    console.log('Creating exec_sql function...');
    const { error: execSqlError } = await supabase.rpc('exec_sql', { 
      sql_string: createExecSqlFunction 
    }).catch(() => {
      // If the function doesn't exist yet, execute it directly
      return supabase.from('_temp').select().limit(1).then(() => {
        return { error: null };
      });
    });

    if (execSqlError) {
      console.log('Note: exec_sql function might already exist or there was an error:', execSqlError.message);
    } else {
      console.log('exec_sql function created successfully');
    }

    // Create the student_mentor_assignments table
    console.log('Creating student_mentor_assignments table...');
    const { error: assignmentsTableError } = await supabase.rpc('exec_sql', { 
      sql_string: createStudentMentorAssignmentsTable 
    });

    if (assignmentsTableError) {
      console.error('Error creating student_mentor_assignments table:', assignmentsTableError.message);
    } else {
      console.log('student_mentor_assignments table created successfully');
    }

    // Create the mentor_meeting_requests table
    console.log('Creating mentor_meeting_requests table...');
    const { error: meetingRequestsTableError } = await supabase.rpc('exec_sql', { 
      sql_string: createMentorMeetingRequestsTable 
    });

    if (meetingRequestsTableError) {
      console.error('Error creating mentor_meeting_requests table:', meetingRequestsTableError.message);
    } else {
      console.log('mentor_meeting_requests table created successfully');
    }

    // Create the assign_student_to_mentor function
    console.log('Creating assign_student_to_mentor function...');
    const { error: assignFunctionError } = await supabase.rpc('exec_sql', { 
      sql_string: createAssignStudentFunction 
    });

    if (assignFunctionError) {
      console.error('Error creating assign_student_to_mentor function:', assignFunctionError.message);
    } else {
      console.log('assign_student_to_mentor function created successfully');
    }

    // Create the remove_student_assignment function
    console.log('Creating remove_student_assignment function...');
    const { error: removeFunctionError } = await supabase.rpc('exec_sql', { 
      sql_string: createRemoveAssignmentFunction 
    });

    if (removeFunctionError) {
      console.error('Error creating remove_student_assignment function:', removeFunctionError.message);
    } else {
      console.log('remove_student_assignment function created successfully');
    }

    // Create the get_mentor_students function
    console.log('Creating get_mentor_students function...');
    const { error: getMentorStudentsFunctionError } = await supabase.rpc('exec_sql', { 
      sql_string: createGetMentorStudentsFunction 
    });

    if (getMentorStudentsFunctionError) {
      console.error('Error creating get_mentor_students function:', getMentorStudentsFunctionError.message);
    } else {
      console.log('get_mentor_students function created successfully');
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error.message);
  }
}

// Run the setup
setupDatabase();