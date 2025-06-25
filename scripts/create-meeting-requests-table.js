// Script to create the meeting_requests table directly
import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // This should be a service key with more privileges

async function createMeetingRequestsTable() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not found in environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('Creating meeting_requests table...');
    
    // Execute SQL to create the table
    const { error } = await supabase.rpc('exec_sql', {
      sql_string: `
        -- Create meeting_requests table
        CREATE TABLE IF NOT EXISTS public.meeting_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            student_id UUID NOT NULL,
            topic TEXT NOT NULL,
            preferred_time TIMESTAMPTZ,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            accepted_by UUID,
            scheduled_time TIMESTAMPTZ,
            meet_link TEXT
        );

        -- Enable RLS
        ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;

        -- Create policies
        -- Students can create meeting requests
        CREATE POLICY IF NOT EXISTS "Students can create meeting requests" 
        ON public.meeting_requests 
        FOR INSERT 
        WITH CHECK (auth.uid() = student_id);

        -- Students can view their meeting requests
        CREATE POLICY IF NOT EXISTS "Students can view their meeting requests" 
        ON public.meeting_requests 
        FOR SELECT 
        USING (auth.uid() = student_id);

        -- Mentors can view pending requests
        CREATE POLICY IF NOT EXISTS "Mentors can view pending requests" 
        ON public.meeting_requests 
        FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles u 
                WHERE u.id = auth.uid() AND u.role = 'mentor'
            ) 
            AND status = 'pending'
        );

        -- Mentors can accept pending requests
        CREATE POLICY IF NOT EXISTS "Mentors can accept pending requests" 
        ON public.meeting_requests 
        FOR UPDATE 
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles u 
                WHERE u.id = auth.uid() AND u.role = 'mentor'
            ) 
            AND status = 'pending'
        );

        -- Mentors can view accepted requests they've accepted
        CREATE POLICY IF NOT EXISTS "Mentors can view accepted requests they've accepted" 
        ON public.meeting_requests 
        FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles u 
                WHERE u.id = auth.uid() AND u.role = 'mentor'
            ) 
            AND accepted_by = auth.uid()
        );

        -- Admin can view all meeting requests
        CREATE POLICY IF NOT EXISTS "Admin can view all meeting requests" 
        ON public.meeting_requests 
        FOR SELECT 
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles u 
                WHERE u.id = auth.uid() AND u.role = 'admin'
            )
        );
      `
    });

    if (error) {
      console.error('Error creating table:', error);
      return;
    }

    console.log('meeting_requests table created successfully!');
  } catch (error) {
    console.error('Unexpected error during table creation:', error);
  }
}

createMeetingRequestsTable();