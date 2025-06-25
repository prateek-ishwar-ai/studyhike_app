-- Enhance study_plans table with new fields
ALTER TABLE public.study_plans 
ADD COLUMN IF NOT EXISTS resource_link TEXT,
ADD COLUMN IF NOT EXISTS authenticity TEXT DEFAULT 'self-decided',
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS added_by TEXT DEFAULT 'student',
ADD COLUMN IF NOT EXISTS mentor_notes TEXT,
ADD COLUMN IF NOT EXISTS week_start DATE;

-- Create test_topics table to track weak topics
CREATE TABLE IF NOT EXISTS public.test_topics (
    id SERIAL PRIMARY KEY,
    test_id UUID REFERENCES public.tests(id) NOT NULL,
    student_id UUID REFERENCES auth.users(id) NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    status TEXT DEFAULT 'needs_improvement',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create weak_topics table to track student's weak areas
CREATE TABLE IF NOT EXISTS public.weak_topics (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    status TEXT DEFAULT 'needs_improvement',
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for test_topics
ALTER TABLE public.test_topics ENABLE ROW LEVEL SECURITY;

-- Students can view their own test topics
CREATE POLICY "Students can view their own test topics"
    ON public.test_topics
    FOR SELECT
    USING (auth.uid() = student_id);

-- Students can create their own test topics
CREATE POLICY "Students can create their own test topics"
    ON public.test_topics
    FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Add RLS policies for weak_topics
ALTER TABLE public.weak_topics ENABLE ROW LEVEL SECURITY;

-- Students can view their own weak topics
CREATE POLICY "Students can view their own weak topics"
    ON public.weak_topics
    FOR SELECT
    USING (auth.uid() = student_id);

-- Students can create their own weak topics
CREATE POLICY "Students can create their own weak topics"
    ON public.weak_topics
    FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Students can update their own weak topics
CREATE POLICY "Students can update their own weak topics"
    ON public.weak_topics
    FOR UPDATE
    USING (auth.uid() = student_id);

-- Create function to update weak topics when test topics are added
CREATE OR REPLACE FUNCTION update_weak_topics()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if topic already exists in weak_topics
    IF EXISTS (
        SELECT 1 FROM public.weak_topics 
        WHERE student_id = NEW.student_id 
        AND subject = NEW.subject 
        AND topic = NEW.topic
    ) THEN
        -- Update existing weak topic
        UPDATE public.weak_topics
        SET 
            status = NEW.status,
            updated_at = now()
        WHERE 
            student_id = NEW.student_id 
            AND subject = NEW.subject 
            AND topic = NEW.topic;
    ELSE
        -- Insert new weak topic
        INSERT INTO public.weak_topics (
            student_id, 
            subject, 
            topic, 
            status
        ) VALUES (
            NEW.student_id,
            NEW.subject,
            NEW.topic,
            NEW.status
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update weak topics when test topics are added
CREATE TRIGGER on_test_topic_inserted
    AFTER INSERT ON public.test_topics
    FOR EACH ROW
    EXECUTE FUNCTION update_weak_topics();

-- Create function to determine topic status based on score
CREATE OR REPLACE FUNCTION calculate_topic_status(score INTEGER, max_score INTEGER)
RETURNS TEXT AS $$
DECLARE
    percentage NUMERIC;
BEGIN
    percentage := (score::NUMERIC / max_score::NUMERIC) * 100;
    
    IF percentage < 40 THEN
        RETURN 'critical_weakness';
    ELSIF percentage < 70 THEN
        RETURN 'needs_improvement';
    ELSE
        RETURN 'good';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add mentor policies for study plans
CREATE POLICY "Mentors can view their students' study plans"
    ON public.study_plans
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assigned_students 
            WHERE mentor_id = auth.uid() AND student_id = study_plans.student_id
        )
    );

CREATE POLICY "Mentors can update their students' study plans"
    ON public.study_plans
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.assigned_students 
            WHERE mentor_id = auth.uid() AND student_id = study_plans.student_id
        )
    );

CREATE POLICY "Mentors can insert study plans for their students"
    ON public.study_plans
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assigned_students 
            WHERE mentor_id = auth.uid() AND student_id = study_plans.student_id
        )
    );

-- Add mentor policies for test_topics
CREATE POLICY "Mentors can view their students' test topics"
    ON public.test_topics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assigned_students 
            WHERE mentor_id = auth.uid() AND student_id = test_topics.student_id
        )
    );

CREATE POLICY "Mentors can insert test topics for their students"
    ON public.test_topics
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.assigned_students 
            WHERE mentor_id = auth.uid() AND student_id = test_topics.student_id
        )
    );

-- Add mentor policies for weak_topics
CREATE POLICY "Mentors can view their students' weak topics"
    ON public.weak_topics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.assigned_students 
            WHERE mentor_id = auth.uid() AND student_id = weak_topics.student_id
        )
    );

CREATE POLICY "Mentors can update their students' weak topics"
    ON public.weak_topics
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.assigned_students 
            WHERE mentor_id = auth.uid() AND student_id = weak_topics.student_id
        )
    );