-- Add subscription fields to students table
DO $$
BEGIN
    -- Add plan column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'students' AND column_name = 'plan') THEN
        ALTER TABLE students ADD COLUMN plan TEXT DEFAULT 'free' NOT NULL;
    END IF;
    
    -- Add plan_start_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'students' AND column_name = 'plan_start_date') THEN
        ALTER TABLE students ADD COLUMN plan_start_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add plan_end_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'students' AND column_name = 'plan_end_date') THEN
        ALTER TABLE students ADD COLUMN plan_end_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add meetings_used column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'students' AND column_name = 'meetings_used') THEN
        ALTER TABLE students ADD COLUMN meetings_used INTEGER DEFAULT 0 NOT NULL;
    END IF;
    
    -- Add on_request_used column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'students' AND column_name = 'on_request_used') THEN
        ALTER TABLE students ADD COLUMN on_request_used INTEGER DEFAULT 0 NOT NULL;
    END IF;
    
    -- Add payment_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'students' AND column_name = 'payment_verified') THEN
        ALTER TABLE students ADD COLUMN payment_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments table
DROP POLICY IF EXISTS "Students can view their own payments" ON payments;
CREATE POLICY "Students can view their own payments"
ON payments FOR SELECT
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Allow server functions to insert payments" ON payments;
CREATE POLICY "Allow server functions to insert payments"
ON payments FOR INSERT
WITH CHECK (true);