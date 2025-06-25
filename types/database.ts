export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      meeting_requests: {
        Row: {
          id: string
          student_id: string
          topic: string
          preferred_time: string | null
          status: "pending" | "accepted"
          created_at: string
          accepted_by: string | null
          scheduled_time: string | null
          meet_link: string | null
        }
        Insert: {
          id?: string
          student_id: string
          topic: string
          preferred_time?: string | null
          status?: "pending" | "accepted"
          created_at?: string
          accepted_by?: string | null
          scheduled_time?: string | null
          meet_link?: string | null
        }
        Update: {
          id?: string
          student_id?: string
          topic?: string
          preferred_time?: string | null
          status?: "pending" | "accepted"
          created_at?: string
          accepted_by?: string | null
          scheduled_time?: string | null
          meet_link?: string | null
        }
      }
      homework: {
        Row: {
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
        Insert: {
          id?: number
          title: string
          description: string
          subject: string
          mentor_id: string
          student_id: string
          due_date: string
          status?: "pending" | "submitted" | "reviewed"
          score?: number | null
          feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          title?: string
          description?: string
          subject?: string
          mentor_id?: string
          student_id?: string
          due_date?: string
          status?: "pending" | "submitted" | "reviewed"
          score?: number | null
          feedback?: string | null
          created_at?: string
        }
      }
      mentors: {
        Row: {
          id: string
          max_students: number
          current_students: number
          rating: number
          created_at: string
        }
        Insert: {
          id: string
          max_students: number
          current_students: number
          rating: number
          created_at?: string
        }
        Update: {
          id?: string
          max_students?: number
          current_students?: number
          rating?: number
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: "admin" | "mentor" | "student"
          phone: string | null
          subject_specialization: string | null
          experience_years: number | null
          current_class: string | null
          target_exam: string | null
          status: "active" | "inactive" | "pending"
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: "admin" | "mentor" | "student"
          phone?: string | null
          subject_specialization?: string | null
          experience_years?: number | null
          current_class?: string | null
          target_exam?: string | null
          status?: "active" | "inactive" | "pending"
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: "admin" | "mentor" | "student"
          phone?: string | null
          subject_specialization?: string | null
          experience_years?: number | null
          current_class?: string | null
          target_exam?: string | null
          status?: "active" | "inactive" | "pending"
          created_at?: string
        }
      }
      resources: {
        Row: {
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
        Insert: {
          id?: number
          title: string
          description: string
          subject: string
          difficulty_level: "Beginner" | "Intermediate" | "Advanced"
          file_url: string
          file_type: string
          uploaded_by: string
          is_approved?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          title?: string
          description?: string
          subject?: string
          difficulty_level?: "Beginner" | "Intermediate" | "Advanced"
          file_url?: string
          file_type?: string
          uploaded_by?: string
          is_approved?: boolean
          created_at?: string
        }
      }
      sessions: {
        Row: {
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
        Insert: {
          id?: number
          mentor_id: string
          student_id: string
          title: string
          description: string
          subject: string
          scheduled_at: string
          duration: number
          status?: "scheduled" | "completed" | "cancelled" | "pending"
          meeting_link?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          mentor_id?: string
          student_id?: string
          title?: string
          description?: string
          subject?: string
          scheduled_at?: string
          duration?: number
          status?: "scheduled" | "completed" | "cancelled" | "pending"
          meeting_link?: string | null
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          mentor_id: string | null
          study_streak: number
          total_score: number
          created_at: string
          plan: "free" | "pro" | "premium"
          plan_start_date: string | null
          plan_end_date: string | null
          meetings_used: number
          on_request_used: number
          payment_verified: boolean
        }
        Insert: {
          id: string
          mentor_id?: string | null
          study_streak?: number
          total_score?: number
          created_at?: string
          plan?: "free" | "pro" | "premium"
          plan_start_date?: string | null
          plan_end_date?: string | null
          meetings_used?: number
          on_request_used?: number
          payment_verified?: boolean
        }
        Update: {
          id?: string
          mentor_id?: string | null
          study_streak?: number
          total_score?: number
          created_at?: string
          plan?: "free" | "pro" | "premium"
          plan_start_date?: string | null
          plan_end_date?: string | null
          meetings_used?: number
          on_request_used?: number
          payment_verified?: boolean
        }
      }
      study_plans: {
        Row: {
          id: number
          student_id: string
          subject: string
          topic: string
          day_of_week: string
          duration_hours: number
          is_completed: boolean
          created_at: string
        }
        Insert: {
          id?: number
          student_id: string
          subject: string
          topic: string
          day_of_week: string
          duration_hours: number
          is_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          student_id?: string
          subject?: string
          topic?: string
          day_of_week?: string
          duration_hours?: number
          is_completed?: boolean
          created_at?: string
        }
      }
      tests: {
        Row: {
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
        Insert: {
          id?: number
          student_id: string
          test_name: string
          subject: string
          score: number
          max_score: number
          test_date: string
          mentor_feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          student_id?: string
          test_name?: string
          subject?: string
          score?: number
          max_score?: number
          test_date?: string
          mentor_feedback?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          student_id: string
          payment_id: string
          order_id: string
          amount: number
          plan: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          payment_id: string
          order_id: string
          amount: number
          plan: string
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          payment_id?: string
          order_id?: string
          amount?: number
          plan?: string
          status?: string
          created_at?: string
        }
      }
    }
  }
}

export type Tables = Database['public']['Tables'];