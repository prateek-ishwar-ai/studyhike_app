-- Create helper functions for storage management

-- Function to get all policies for a bucket
CREATE OR REPLACE FUNCTION public.get_policies_for_bucket(bucket_name text)
RETURNS TABLE (
  id uuid,
  name text,
  bucket_id uuid,
  definition jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.id, p.name, p.bucket_id, p.definition, p.created_at, p.updated_at
  FROM storage.policies p
  JOIN storage.buckets b ON p.bucket_id = b.id
  WHERE b.name = bucket_name;
$$;

-- Function to delete all policies for a bucket
CREATE OR REPLACE FUNCTION public.delete_all_policies_for_bucket(bucket_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM storage.policies p
  USING storage.buckets b
  WHERE p.bucket_id = b.id AND b.name = bucket_name;
END;
$$;