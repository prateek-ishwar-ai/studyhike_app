-- Add shared_with column to resources table if it doesn't exist
ALTER TABLE resources ADD COLUMN IF NOT EXISTS shared_with UUID REFERENCES profiles(id);