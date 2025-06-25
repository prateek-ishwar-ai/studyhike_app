// Types for Supabase tables

export interface Homework {
  id: number
  title: string
  description: string
  subject: string
  mentor_id: string
  student_id: string
  due_date: string
  status: "pending" | "submitted" | "reviewed"
  score: number | null
  feedback: string | null
  created_at: string
}

export interface Profile {
  id: string
  created_at: string
  email: string
  full_name: string
  role: "admin" | "mentor" | "student"
  phone: string | null
  subject_specialization: string | null
  experience_years: number | null
  current_class: string | null
  target_exam: string | null
  status: "active" | "inactive" | "pending"
}

export interface Session {
  id: number
  mentor_id: string
  student_id: string
  title: string
  description: string
  subject: string
  scheduled_at: string
  duration: number
  status: "scheduled" | "completed" | "cancelled" | "pending"
  meeting_link: string | null
  created_at: string
}

export interface Mentor {
  id: string
  max_students: number
  current_students: number
  rating: number
  created_at: string
}

export interface Student {
  id: string
  mentor_id: string | null
  study_streak: number
  total_score: number
  created_at: string
}

export interface Test {
  id: number
  student_id: string
  test_name: string
  subject: string
  score: number
  max_score: number
  test_date: string
  mentor_feedback: string | null
  created_at: string
}

export interface StudyPlan {
  id: number
  student_id: string
  subject: string
  topic: string
  day_of_week: string
  duration_hours: number
  is_completed: boolean
  created_at: string
}

export interface Resource {
  id: number
  title: string
  description: string
  subject: string
  difficulty_level: "Beginner" | "Intermediate" | "Advanced"
  file_url: string
  file_type: string
  uploaded_by: string
  is_approved: boolean
  created_at: string
}