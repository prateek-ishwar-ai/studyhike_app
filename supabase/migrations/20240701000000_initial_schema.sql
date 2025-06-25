-- Create student profile tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    date_of_birth DATE,
    address TEXT,
    target_exam TEXT DEFAULT 'JEE Main & Advanced',
    current_class TEXT DEFAULT '12th',
    school_name TEXT,
    preferred_subjects TEXT[] DEFAULT '{"Physics", "Mathematics"}',
    study_goal TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    role TEXT DEFAULT 'student'
);

-- Create students table (extends profiles)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    study_streak INTEGER DEFAULT 0,
    total_study_hours INTEGER DEFAULT 0,
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    parent_email TEXT,
    parent_phone TEXT
);

-- Create study plans table
CREATE TABLE IF NOT EXISTS public.study_plans (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    day_of_week TEXT NOT NULL,
    duration_hours NUMERIC NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create tests table
CREATE TABLE IF NOT EXISTS public.tests (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) NOT NULL,
    test_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    test_date DATE NOT NULL,
    percentile NUMERIC,
    mentor_feedback TEXT,
    mentor_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) NOT NULL,
    mentor_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    meeting_link TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create homework table
CREATE TABLE IF NOT EXISTS public.homework (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) NOT NULL,
    mentor_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending',
    submission_file_url TEXT,
    submission_notes TEXT,
    feedback TEXT,
    score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    submitted_at TIMESTAMP WITH TIME ZONE
);

-- Create mentor questions table
CREATE TABLE IF NOT EXISTS public.mentor_questions (
    id SERIAL PRIMARY KEY,
    student_id UUID REFERENCES auth.users(id) NOT NULL,
    mentor_id UUID REFERENCES auth.users(id),
    subject TEXT NOT NULL,
    question_text TEXT NOT NULL,
    mentor_response TEXT,
    is_answered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    answered_at TIMESTAMP WITH TIME ZONE
);

-- Create learning resources table
CREATE TABLE IF NOT EXISTS public.learning_resources (
    id SERIAL PRIMARY KEY,
    mentor_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    file_url TEXT NOT NULL,
    rating NUMERIC DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Create policies for students
CREATE POLICY "Students can view their own data"
    ON public.students
    FOR SELECT
    USING (auth.uid() = id);

-- Create policies for study plans
CREATE POLICY "Students can view their own study plans"
    ON public.study_plans
    FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own study plans"
    ON public.study_plans
    FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own study plans"
    ON public.study_plans
    FOR UPDATE
    USING (auth.uid() = student_id);

-- Create policies for tests
CREATE POLICY "Students can view their own tests"
    ON public.tests
    FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own test entries"
    ON public.tests
    FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Create policies for sessions
CREATE POLICY "Students can view their own sessions"
    ON public.sessions
    FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own session requests"
    ON public.sessions
    FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Create policies for homework
CREATE POLICY "Students can view their own homework"
    ON public.homework
    FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can update their own homework submissions"
    ON public.homework
    FOR UPDATE
    USING (auth.uid() = student_id);

-- Create policies for mentor questions
CREATE POLICY "Students can view their own questions"
    ON public.mentor_questions
    FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own questions"
    ON public.mentor_questions
    FOR INSERT
    WITH CHECK (auth.uid() = student_id);

-- Create policies for learning resources
CREATE POLICY "Everyone can view learning resources"
    ON public.learning_resources
    FOR SELECT
    USING (true);

-- Create profile trigger to auto-create student record
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, role)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', null, 'student');
    
    INSERT INTO public.students (id)
    VALUES (new.id);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_profiles_timestamp
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();