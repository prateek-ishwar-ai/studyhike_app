-- Insert demo users
INSERT INTO profiles (id, email, full_name, role, phone, subject_specialization, experience_years, current_class, target_exam, status) VALUES
-- Admin
('11111111-1111-1111-1111-111111111111', 'admin@demo.com', 'Admin User', 'admin', '+91 9876543210', NULL, NULL, NULL, NULL, 'active'),

-- Mentors
('22222222-2222-2222-2222-222222222222', 'mentor@demo.com', 'Dr. Rajeev Kumar', 'mentor', '+91 9876543211', 'Physics', 8, NULL, NULL, 'active'),
('33333333-3333-3333-3333-333333333333', 'anjali@demo.com', 'Dr. Anjali Sharma', 'mentor', '+91 9876543212', 'Chemistry', 6, NULL, NULL, 'active'),
('44444444-4444-4444-4444-444444444444', 'suresh@demo.com', 'Prof. Suresh Gupta', 'mentor', '+91 9876543213', 'Mathematics', 10, NULL, NULL, 'active'),

-- Students
('55555555-5555-5555-5555-555555555555', 'student@demo.com', 'Rahul Sharma', 'student', '+91 9876543214', NULL, NULL, '12th', 'JEE Main', 'active'),
('66666666-6666-6666-6666-666666666666', 'priya@demo.com', 'Priya Singh', 'student', '+91 9876543215', NULL, NULL, '12th', 'JEE Advanced', 'active'),
('77777777-7777-7777-7777-777777777777', 'amit@demo.com', 'Amit Patel', 'student', '+91 9876543216', NULL, NULL, '11th', 'JEE Main', 'active');

-- Insert mentor records
INSERT INTO mentors (id, max_students, current_students, rating) VALUES
('22222222-2222-2222-2222-222222222222', 50, 2, 4.8),
('33333333-3333-3333-3333-333333333333', 40, 1, 4.9),
('44444444-4444-4444-4444-444444444444', 45, 1, 4.7);

-- Insert student records with mentor assignments
INSERT INTO students (id, mentor_id, study_streak, total_score) VALUES
('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 15, 850),
('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 22, 920),
('77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', 8, 720);

-- Insert homework assignments
INSERT INTO homework (title, description, subject, mentor_id, student_id, due_date, status, score, feedback) VALUES
('NCERT Physics Ch.2 Problems', 'Complete all problems from Chapter 2 - Kinematics. Focus on problems 1-15.', 'Physics', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', '2024-06-10 23:59:59', 'pending', NULL, NULL),
('Organic Chemistry Reactions', 'Study and practice all reactions from Organic Chemistry Chapter 3.', 'Chemistry', '33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', '2024-06-12 23:59:59', 'submitted', NULL, NULL),
('Integration Practice Set', 'Solve integration problems from the practice set provided.', 'Mathematics', '44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777777', '2024-06-08 23:59:59', 'reviewed', 85, 'Good work! Try to improve your approach on problem 4.');

-- Insert test records
INSERT INTO tests (student_id, test_name, subject, score, max_score, test_date, mentor_feedback) VALUES
('55555555-5555-5555-5555-555555555555', 'Physics Mock Test 1', 'Physics', 78, 100, '2024-06-01', 'Good performance in mechanics. Work on thermodynamics.'),
('66666666-6666-6666-6666-666666666666', 'Chemistry Mock Test 1', 'Chemistry', 92, 100, '2024-06-02', 'Excellent work! Keep up the good performance.'),
('77777777-7777-7777-7777-777777777777', 'Math Mock Test 1', 'Mathematics', 65, 100, '2024-06-03', 'Need to practice more calculus problems.');

-- Insert session records
INSERT INTO sessions (mentor_id, student_id, title, description, subject, scheduled_at, duration, status, meeting_link) VALUES
('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'Physics Doubt Clearing', 'Discuss kinematics problems and concepts', 'Physics', '2024-06-08 18:00:00', 60, 'scheduled', 'https://meet.google.com/abc-defg-hij'),
('33333333-3333-3333-3333-333333333333', '66666666-6666-6666-6666-666666666666', 'Chemistry Organic Reactions', 'Review organic chemistry reactions and mechanisms', 'Chemistry', '2024-06-10 16:00:00', 90, 'pending', NULL),
('44444444-4444-4444-4444-444444444444', '77777777-7777-7777-7777-777777777777', 'Mathematics Integration', 'Integration techniques and applications', 'Mathematics', '2024-06-06 17:00:00', 60, 'completed', NULL);

-- Insert resources
INSERT INTO resources (title, description, subject, difficulty_level, file_url, file_type, uploaded_by, is_approved) VALUES
('JEE Physics Formula Sheet', 'Complete formula sheet for JEE Physics', 'Physics', 'Intermediate', '/resources/physics-formulas.pdf', 'PDF', '22222222-2222-2222-2222-222222222222', true),
('Organic Chemistry Reactions Chart', 'Visual chart of important organic reactions', 'Chemistry', 'Advanced', '/resources/organic-reactions.pdf', 'PDF', '33333333-3333-3333-3333-333333333333', true),
('Calculus Practice Problems', 'Set of calculus problems with solutions', 'Mathematics', 'Intermediate', '/resources/calculus-problems.pdf', 'PDF', '44444444-4444-4444-4444-444444444444', true);

-- Insert study plans
INSERT INTO study_plans (student_id, subject, topic, day_of_week, duration_hours, is_completed) VALUES
('55555555-5555-5555-5555-555555555555', 'Physics', 'Kinematics', 'Monday', 2.0, true),
('55555555-5555-5555-5555-555555555555', 'Physics', 'Dynamics', 'Tuesday', 2.5, false),
('66666666-6666-6666-6666-666666666666', 'Chemistry', 'Organic Reactions', 'Wednesday', 3.0, true),
('77777777-7777-7777-7777-777777777777', 'Mathematics', 'Integration', 'Thursday', 2.0, false);
