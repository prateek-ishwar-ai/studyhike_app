-- Add subscription fields to students table
ALTER TABLE students 
ADD COLUMN plan TEXT DEFAULT 'free' NOT NULL,
ADD COLUMN plan_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN plan_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN meetings_used INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN on_request_used INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN payment_verified BOOLEAN DEFAULT FALSE;

-- Create payments table to track payment history
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) NOT NULL,
  payment_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add constraint to ensure student_id exists
  CONSTRAINT fk_student_id FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Create RLS policies for payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Only allow students to view their own payments
CREATE POLICY "Students can view their own payments" 
ON payments FOR SELECT 
USING (auth.uid() = student_id);

-- Allow server-side functions to insert payments
CREATE POLICY "Allow server functions to insert payments" 
ON payments FOR INSERT 
WITH CHECK (true);

-- Create function to update student plan after payment verification
CREATE OR REPLACE FUNCTION update_student_plan(
  p_student_id UUID,
  p_plan TEXT,
  p_payment_id TEXT,
  p_order_id TEXT,
  p_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  plan_duration INTERVAL := INTERVAL '30 days';
  current_time TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Insert payment record
  INSERT INTO payments (
    student_id, 
    payment_id, 
    order_id, 
    amount, 
    plan, 
    status
  ) VALUES (
    p_student_id, 
    p_payment_id, 
    p_order_id, 
    p_amount, 
    p_plan, 
    'success'
  );
  
  -- Update student plan
  UPDATE students
  SET 
    plan = p_plan,
    plan_start_date = current_time,
    plan_end_date = current_time + plan_duration,
    meetings_used = 0,
    on_request_used = 0,
    payment_verified = TRUE
  WHERE id = p_student_id;
  
  RETURN TRUE;
END;
$$;

-- Create function to check if student has access to premium features
CREATE OR REPLACE FUNCTION has_premium_access(
  p_student_id UUID,
  p_feature TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  student_plan TEXT;
  plan_valid BOOLEAN;
BEGIN
  -- Get student plan and check if it's still valid
  SELECT 
    plan,
    CASE WHEN plan_end_date > NOW() THEN TRUE ELSE FALSE END
  INTO 
    student_plan,
    plan_valid
  FROM students
  WHERE id = p_student_id;
  
  -- If plan is expired, downgrade to free
  IF NOT plan_valid AND student_plan != 'free' THEN
    UPDATE students
    SET plan = 'free'
    WHERE id = p_student_id;
    
    student_plan := 'free';
  END IF;
  
  -- Check feature access based on plan
  CASE
    WHEN p_feature = 'mentor_meetings' THEN
      RETURN student_plan IN ('pro', 'premium');
    WHEN p_feature = 'test_analysis' THEN
      RETURN student_plan IN ('pro', 'premium');
    WHEN p_feature = 'resources' THEN
      RETURN student_plan IN ('pro', 'premium');
    WHEN p_feature = 'on_request_meetings' THEN
      RETURN student_plan = 'premium';
    WHEN p_feature = 'custom_study_plans' THEN
      RETURN student_plan = 'premium';
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

-- Create function to increment meeting usage
CREATE OR REPLACE FUNCTION increment_meeting_usage(
  p_student_id UUID,
  p_meeting_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  student_plan TEXT;
  meetings_limit INTEGER;
  current_usage INTEGER;
BEGIN
  -- Get student plan
  SELECT plan INTO student_plan
  FROM students
  WHERE id = p_student_id;
  
  -- Set limits based on plan
  IF p_meeting_type = 'regular' THEN
    IF student_plan = 'free' THEN
      meetings_limit := 8;
    ELSIF student_plan = 'pro' THEN
      meetings_limit := 8;
    ELSIF student_plan = 'premium' THEN
      meetings_limit := 8;
    ELSE
      RETURN FALSE;
    END IF;
    
    -- Get current usage
    SELECT meetings_used INTO current_usage
    FROM students
    WHERE id = p_student_id;
    
    -- Check if limit reached
    IF current_usage >= meetings_limit THEN
      RETURN FALSE;
    END IF;
    
    -- Increment usage
    UPDATE students
    SET meetings_used = meetings_used + 1
    WHERE id = p_student_id;
    
  ELSIF p_meeting_type = 'on_request' THEN
    -- Only premium plan has on-request meetings
    IF student_plan != 'premium' THEN
      RETURN FALSE;
    END IF;
    
    -- Get current usage
    SELECT on_request_used INTO current_usage
    FROM students
    WHERE id = p_student_id;
    
    -- Check if limit reached (8 on-request meetings for premium)
    IF current_usage >= 8 THEN
      RETURN FALSE;
    END IF;
    
    -- Increment usage
    UPDATE students
    SET on_request_used = on_request_used + 1
    WHERE id = p_student_id;
  ELSE
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;