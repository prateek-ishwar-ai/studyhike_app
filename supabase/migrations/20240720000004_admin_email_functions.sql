-- Create a function to get user emails by role (for admin use only)
CREATE OR REPLACE FUNCTION get_user_emails_by_role(role_name TEXT)
RETURNS TABLE (email TEXT)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can access user emails';
  END IF;
  
  -- Return emails for users with the specified role
  RETURN QUERY
  SELECT u.email
  FROM auth.users u
  JOIN public.profiles p ON u.id = p.id
  WHERE p.role = role_name;
END;
$$;

-- Create a function to get a specific user's email (for admin use only)
CREATE OR REPLACE FUNCTION get_user_email(user_id UUID)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Check if the user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can access user emails';
  END IF;
  
  -- Get the user's email
  SELECT u.email INTO user_email
  FROM auth.users u
  WHERE u.id = user_id;
  
  RETURN user_email;
END;
$$;

-- Add email column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
    
    -- Create a trigger to sync email from auth.users to profiles
    CREATE OR REPLACE FUNCTION sync_email_to_profile()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE public.profiles
      SET email = NEW.email
      WHERE id = NEW.id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    CREATE TRIGGER on_auth_user_email_updated
      AFTER UPDATE OF email ON auth.users
      FOR EACH ROW
      EXECUTE PROCEDURE sync_email_to_profile();
      
    -- Populate existing profiles with emails
    UPDATE public.profiles p
    SET email = u.email
    FROM auth.users u
    WHERE p.id = u.id;
  END IF;
END
$$;