-- This migration fixes the check_update_permission function

-- Drop the function if it exists (to avoid conflicts)
DROP FUNCTION IF EXISTS public.check_update_permission;

-- Create the function with the correct signature
CREATE OR REPLACE FUNCTION public.check_update_permission()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() = NEW.student_id OR auth.uid() = NEW.mentor_id THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'You do not have permission to update this record';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to use this function
DROP TRIGGER IF EXISTS check_update_permission_trigger ON meeting_requests;
CREATE TRIGGER check_update_permission_trigger
BEFORE UPDATE ON meeting_requests
FOR EACH ROW
EXECUTE FUNCTION public.check_update_permission();

-- Also create a version with parameters for direct calls
DROP FUNCTION IF EXISTS public.check_update_permission(uuid);
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