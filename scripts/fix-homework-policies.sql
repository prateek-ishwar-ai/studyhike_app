-- Check if the update policy exists and create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'homework' 
        AND policyname = 'Students can update own homework'
    ) THEN
        EXECUTE 'CREATE POLICY "Students can update own homework" ON homework FOR UPDATE USING (auth.uid() = student_id)';
    END IF;
END
$$;

-- Check if the insert policy exists and create it if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'homework' 
        AND policyname = 'Students can insert homework'
    ) THEN
        EXECUTE 'CREATE POLICY "Students can insert homework" ON homework FOR INSERT WITH CHECK (auth.uid() = student_id)';
    END IF;
END
$$;