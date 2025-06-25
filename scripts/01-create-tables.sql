-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create enum types
CREATE TYPE user_role AS ENUM ('student', 'mentor', 'admin');
CREATE TYPE homework_status AS ENUM ('pending', 'submitted', 'reviewed');
CREATE TYPE session_type AS ENUM ('one_on_one', 'group');
CREATE TYPE session_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id UUID REFERENCES profiles(id) PRIMARY KEY,
    mentor_id UUID REFERENCES profiles(id),
    target_exam TEXT DEFAULT 'JEE Main',
    current_class INTEGER DEFAULT 12,
    study_streak INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mentors table
CREATE TABLE mentors (
    id UUID REFERENCES profiles(id) PRIMARY KEY,
    specialization TEXT[],
    max_students INTEGER DEFAULT 50,
    current_students INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Homework table
CREATE TABLE homework (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT NOT NULL,
    mentor_id UUID REFERENCES profiles(id) NOT NULL,
    student_id UUID REFERENCES profiles(id),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status homework_status DEFAULT 'pending',
    submission_file_url TEXT,
    feedback TEXT,
    score INTEGER,
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

-- Sessions table
CREATE TABLE sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mentor_id UUID REFERENCES profiles(id) NOT NULL,
    student_id UUID REFERENCES profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    session_type session_type DEFAULT 'one_on_one',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    meeting_link TEXT,
    status session_status DEFAULT 'scheduled',
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

CREATE POLICY "Students can view own data" ON students FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Mentors can view assigned students" ON students FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'mentor')
);

CREATE POLICY "Students can view own homework" ON homework FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Mentors can view assigned homework" ON homework FOR SELECT USING (auth.uid() = mentor_id);

CREATE POLICY "Students can view own tests" ON tests FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can view own sessions" ON sessions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Mentors can view their sessions" ON sessions FOR SELECT USING (auth.uid() = mentor_id);

CREATE POLICY "Students can view own study plans" ON study_plans FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can update own study plans" ON study_plans FOR UPDATE USING (auth.uid() = student_id);
