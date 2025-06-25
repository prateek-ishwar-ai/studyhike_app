-- Fix meeting_requests table schema
-- First, check if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'meeting_requests') THEN
    -- Add mentor_id column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'meeting_requests' 
                  AND column_name = 'mentor_id') THEN
      ALTER TABLE public.meeting_requests ADD COLUMN mentor_id UUID REFERENCES public.profiles(id);
    END IF;
    
    -- Update status check constraint to include all possible statuses
    ALTER TABLE public.meeting_requests DROP CONSTRAINT IF EXISTS meeting_requests_status_check;
    ALTER TABLE public.meeting_requests ADD CONSTRAINT meeting_requests_status_check 
      CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed'));
    
    -- Update preferred_time to be TEXT instead of TIMESTAMPTZ to allow for flexible time descriptions
    ALTER TABLE public.meeting_requests ALTER COLUMN preferred_time TYPE TEXT USING preferred_time::TEXT;
    
    -- Create or replace the function to check update permissions
    CREATE OR REPLACE FUNCTION public.check_meeting_update_permission()
    RETURNS TRIGGER AS $func$
    BEGIN
      -- Allow students to update their own requests
      IF auth.uid() = OLD.student_id THEN
        RETURN NEW;
      -- Allow mentors to update requests assigned to them
      ELSIF auth.uid() = OLD.mentor_id OR auth.uid() = NEW.mentor_id THEN
        RETURN NEW;
      -- Allow admins to update any request
      ELSIF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      ) THEN
        RETURN NEW;
      ELSE
        RAISE EXCEPTION 'You do not have permission to update this meeting request';
      END IF;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create trigger for the update permission function
    DROP TRIGGER IF EXISTS check_meeting_update_permission_trigger ON public.meeting_requests;
    CREATE TRIGGER check_meeting_update_permission_trigger
    BEFORE UPDATE ON public.meeting_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.check_meeting_update_permission();
    
    -- Create or replace the function to create the meeting_requests table
    CREATE OR REPLACE FUNCTION public.create_meeting_requests_table()
    RETURNS boolean AS $func$
    BEGIN
      -- This function is now just a placeholder since the table already exists
      -- and we've made the necessary modifications above
      RETURN true;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
  ELSE
    -- Create the meeting_requests table if it doesn't exist
    CREATE TABLE public.meeting_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES public.profiles(id),
      mentor_id UUID REFERENCES public.profiles(id),
      topic TEXT NOT NULL,
      preferred_time TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      accepted_by UUID REFERENCES public.profiles(id),
      scheduled_time TIMESTAMPTZ,
      meet_link TEXT
    );

    -- Enable RLS
    ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;

    -- Create policies
    -- Students can create meeting requests
    CREATE POLICY "Students can create meeting requests" 
    ON public.meeting_requests 
    FOR INSERT 
    WITH CHECK (auth.uid() = student_id);

    -- Students can view their meeting requests
    CREATE POLICY "Students can view their meeting requests" 
    ON public.meeting_requests 
    FOR SELECT 
    USING (auth.uid() = student_id);

    -- Students can update their pending meeting requests
    CREATE POLICY "Students can update their pending meeting requests" 
    ON public.meeting_requests 
    FOR UPDATE 
    USING (auth.uid() = student_id AND status = 'pending');

    -- Students can delete their pending meeting requests
    CREATE POLICY "Students can delete their pending meeting requests" 
    ON public.meeting_requests 
    FOR DELETE 
    USING (auth.uid() = student_id AND status = 'pending');

    -- Mentors can view pending requests
    CREATE POLICY "Mentors can view pending requests" 
    ON public.meeting_requests 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles u 
        WHERE u.id = auth.uid() AND u.role = 'mentor'
      ) 
      AND status = 'pending'
    );

    -- Mentors can view requests assigned to them
    CREATE POLICY "Mentors can view requests assigned to them" 
    ON public.meeting_requests 
    FOR SELECT 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles u 
        WHERE u.id = auth.uid() AND u.role = 'mentor'
      ) 
      AND (mentor_id = auth.uid() OR accepted_by = auth.uid())
    );

    -- Mentors can update requests assigned to them
    CREATE POLICY "Mentors can update requests assigned to them" 
    ON public.meeting_requests 
    FOR UPDATE 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles u 
        WHERE u.id = auth.uid() AND u.role = 'mentor'
      ) 
      AND (mentor_id = auth.uid() OR accepted_by = auth.uid() OR status = 'pending')
    );

    -- Admin can view all meeting requests
    CREATE POLICY "Admin can view all meeting requests" 
    ON public.meeting_requests 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles u 
        WHERE u.id = auth.uid() AND u.role = 'admin'
      )
    );

    -- Create the update permission function and trigger
    CREATE OR REPLACE FUNCTION public.check_meeting_update_permission()
    RETURNS TRIGGER AS $func$
    BEGIN
      -- Allow students to update their own requests
      IF auth.uid() = OLD.student_id THEN
        RETURN NEW;
      -- Allow mentors to update requests assigned to them
      ELSIF auth.uid() = OLD.mentor_id OR auth.uid() = NEW.mentor_id THEN
        RETURN NEW;
      -- Allow admins to update any request
      ELSIF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      ) THEN
        RETURN NEW;
      ELSE
        RAISE EXCEPTION 'You do not have permission to update this meeting request';
      END IF;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;

    CREATE TRIGGER check_meeting_update_permission_trigger
    BEFORE UPDATE ON public.meeting_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.check_meeting_update_permission();
    
    -- Create the function to create the meeting_requests table
    CREATE OR REPLACE FUNCTION public.create_meeting_requests_table()
    RETURNS boolean AS $func$
    BEGIN
      -- This function is now just a placeholder since the table is created above
      RETURN true;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
  END IF;
END
$$;