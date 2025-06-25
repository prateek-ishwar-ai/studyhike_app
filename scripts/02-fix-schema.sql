-- Drop existing tables to recreate with proper relationships
DROP TABLE IF EXISTS study_plans CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS homework CASCADE;
DROP TABLE IF EXISTS mentors CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    phone TEXT,
    subject_specialization TEXT,
    experience_years INTEGER,
    current_class TEXT,
    target_exam TEXT DEFAULT 'JEE Main',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id UUID REFERENCES profiles(id) PRIMARY KEY,
    mentor_id UUID REFERENCES profiles(id),
    study_streak INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mentors table
CREATE TABLE mentors (
    id UUID REFERENCES profiles(id) PRIMARY KEY,
    max_students INTEGER DEFAULT 50,
    current_students INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Homework table with proper foreign keys
CREATE TABLE homework (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    mentor_id UUID REFERENCES profiles(id) NOT NULL,
    student_id UUID REFERENCES profiles(id) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status homework_status DEFAULT 'pending',
    submission_file_url TEXT,
    feedback TEXT,
    score INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tests table
CREATE TABLE tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) NOT NULL,
    test_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    test_date DATE NOT NULL,
    scorecard_url TEXT,
    mentor_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table with proper foreign keys
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID REFERENCES profiles(id) NOT NULL,
    student_id UUID REFERENCES profiles(id) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    session_type session_type DEFAULT 'one_on_one',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER DEFAULT 60,
    meeting_link TEXT,
    status session_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources table
CREATE TABLE resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    difficulty_level TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study Plan table
CREATE TABLE study_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES profiles(id) NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    day_of_week TEXT NOT NULL,
    duration_hours DECIMAL(3,1) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Students can view own data" ON students FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Mentors can view assigned students" ON students FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('mentor', 'admin'))
);

CREATE POLICY "Students can view own homework" ON homework FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Mentors can view assigned homework" ON homework FOR SELECT USING (auth.uid() = mentor_id);
CREATE POLICY "Admins can view all homework" ON homework FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Students can insert homework" ON homework FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Mentors can update homework" ON homework FOR UPDATE USING (auth.uid() = mentor_id);

CREATE POLICY "Students can view own tests" ON tests FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Mentors and admins can view tests" ON tests FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('mentor', 'admin'))
);

CREATE POLICY "Students can view own sessions" ON sessions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Mentors can view their sessions" ON sessions FOR SELECT USING (auth.uid() = mentor_id);
CREATE POLICY "Admins can view all sessions" ON sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Students can insert sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Mentors can update sessions" ON sessions FOR UPDATE USING (auth.uid() = mentor_id);

CREATE POLICY "Students can view own study plans" ON study_plans FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can update own study plans" ON study_plans FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Students can insert study plans" ON study_plans FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "All can view approved resources" ON resources FOR SELECT USING (is_approved = true);
CREATE POLICY "Mentors and admins can view all resources" ON resources FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('mentor', 'admin'))
);
CREATE POLICY "Users can insert resources" ON resources FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
