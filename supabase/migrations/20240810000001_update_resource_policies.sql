-- Update the student view policy to include shared_with
DROP POLICY IF EXISTS "Students can view resources shared with them" ON resources;

CREATE POLICY "Students can view resources shared with them" ON resources
  FOR SELECT
  TO authenticated
  USING (
    (shared_with = auth.uid() OR shared_with IS NULL) AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'student'
    )
  );