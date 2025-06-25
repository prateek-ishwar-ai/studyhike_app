-- Create a function to check if a user is authenticated

-- Drop the function if it exists
DROP FUNCTION IF EXISTS public.is_authenticated;

-- Create the function
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$;