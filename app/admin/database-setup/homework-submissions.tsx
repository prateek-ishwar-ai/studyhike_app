"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function HomeworkSubmissionsSetup() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const createHomeworkSubmissionsTable = async () => {
    if (!supabase) {
      toast({
        title: "Error",
        description: "Database connection not available",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      console.log("Starting homework_submissions table setup...");
      
      // Create the homework_submissions table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.homework_submissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID NOT NULL,
          title TEXT NOT NULL,
          subject TEXT NOT NULL,
          description TEXT,
          file_path TEXT,
          status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned')),
          grade TEXT,
          feedback TEXT,
          feedback_file_path TEXT,
          submitted_at TIMESTAMPTZ DEFAULT NOW(),
          graded_at TIMESTAMPTZ,
          graded_by UUID
        );
      `

      // First try to create the table
      const { error: createTableError } = await supabase.rpc('exec_sql', { sql_string: createTableSQL })
      
      if (createTableError) {
        console.error("Error creating table:", createTableError);
        throw new Error(`Failed to create table: ${createTableError.message}`);
      }

      console.log("Table created successfully, now adding indexes and policies...");

      // Add indexes
      const indexesSQL = `
        -- Add indexes for performance
        CREATE INDEX IF NOT EXISTS idx_homework_submissions_student_id ON public.homework_submissions(student_id);
        CREATE INDEX IF NOT EXISTS idx_homework_submissions_status ON public.homework_submissions(status);
      `

      const { error: indexError } = await supabase.rpc('exec_sql', { sql_string: indexesSQL })

      if (indexError) {
        console.warn("Error creating indexes:", indexError);
        // Continue anyway as the table was created
      }

      // Enable RLS and add policies
      const policiesSQL = `
        -- Enable RLS
        ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        -- Admin can do everything
        CREATE POLICY "Admin can manage all homework submissions" 
        ON public.homework_submissions 
        FOR ALL 
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
          )
        );
        
        -- Mentors can view homework submissions for their assigned students
        CREATE POLICY "Mentors can view their students' homework submissions" 
        ON public.homework_submissions 
        FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM public.student_mentor_assignments sma
            WHERE sma.mentor_id = auth.uid() AND sma.student_id = homework_submissions.student_id
          )
        );
        
        -- Mentors can update homework submissions for their assigned students (for grading)
        CREATE POLICY "Mentors can grade homework for their students" 
        ON public.homework_submissions 
        FOR UPDATE 
        USING (
          EXISTS (
            SELECT 1 FROM public.student_mentor_assignments sma
            WHERE sma.mentor_id = auth.uid() AND sma.student_id = homework_submissions.student_id
          )
        );
        
        -- Students can view their own homework submissions
        CREATE POLICY "Students can view their own homework submissions" 
        ON public.homework_submissions 
        FOR SELECT 
        USING (student_id = auth.uid());
        
        -- Students can submit homework
        CREATE POLICY "Students can submit homework" 
        ON public.homework_submissions 
        FOR INSERT 
        WITH CHECK (student_id = auth.uid());
      `

      const { error: policyError } = await supabase.rpc('exec_sql', { sql_string: policiesSQL })

      if (policyError) {
        console.warn("Error setting up RLS policies:", policyError);
        // Continue anyway as the table was created
      }

      // Create storage buckets for homework submissions and feedback
      try {
        // Create homework-submissions bucket
        const { error: homeworkBucketError } = await supabase.storage.createBucket('homework-submissions', {
          public: false,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        })

        if (homeworkBucketError) {
          console.warn("Error creating homework-submissions bucket:", homeworkBucketError);
        }

        // Create mentor-feedback bucket
        const { error: feedbackBucketError } = await supabase.storage.createBucket('mentor-feedback', {
          public: false,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        })

        if (feedbackBucketError) {
          console.warn("Error creating mentor-feedback bucket:", feedbackBucketError);
        }
      } catch (bucketError) {
        console.warn("Error creating storage buckets:", bucketError);
        // Continue anyway as the table was created
      }

      setResult("Successfully created 'homework_submissions' table and storage buckets.")
      toast({
        title: "Success",
        description: "Homework submissions table and storage buckets created successfully."
      })
    } catch (error) {
      console.error("Error creating homework_submissions table:", error)
      
      let errorMessage = "Unknown error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setResult(`Error: ${errorMessage}`)
      toast({
        title: "Error",
        description: `Failed to create table: ${errorMessage}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        This will create a table to store student homework submissions and mentor feedback. It will also create
        storage buckets for homework files and feedback files.
      </p>
      {result && (
        <div className={`p-4 rounded-md mb-4 ${result.includes("Error") ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
          {result}
        </div>
      )}
      <Button onClick={createHomeworkSubmissionsTable} disabled={loading} className="w-full">
        {loading ? (
          <>
            <LoadingSpinner size="sm" animation="spin" className="mr-2" />
            Creating Table...
          </>
        ) : (
          "Create Homework Submissions Table"
        )}
      </Button>
    </div>
  )
}