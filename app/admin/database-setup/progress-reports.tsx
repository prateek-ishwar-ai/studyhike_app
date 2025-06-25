"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function ProgressReportsSetup() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const createProgressReportsTable = async () => {
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
      console.log("Starting progress_reports table setup...");
      
      // Create the progress_reports table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.progress_reports (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID NOT NULL,
          mentor_id UUID NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          period TEXT,
          strengths TEXT,
          areas_for_improvement TEXT,
          recommendations TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
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
        CREATE INDEX IF NOT EXISTS idx_progress_reports_student_id ON public.progress_reports(student_id);
        CREATE INDEX IF NOT EXISTS idx_progress_reports_mentor_id ON public.progress_reports(mentor_id);
        CREATE INDEX IF NOT EXISTS idx_progress_reports_created_at ON public.progress_reports(created_at);
      `

      const { error: indexError } = await supabase.rpc('exec_sql', { sql_string: indexesSQL })

      if (indexError) {
        console.warn("Error creating indexes:", indexError);
        // Continue anyway as the table was created
      }

      // Enable RLS and add policies
      const policiesSQL = `
        -- Enable RLS
        ALTER TABLE public.progress_reports ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        -- Admin can do everything
        CREATE POLICY "Admin can manage all progress reports" 
        ON public.progress_reports 
        FOR ALL 
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
          )
        );
        
        -- Mentors can view progress reports they created
        CREATE POLICY "Mentors can view progress reports they created" 
        ON public.progress_reports 
        FOR SELECT 
        USING (mentor_id = auth.uid());
        
        -- Mentors can create progress reports for their assigned students
        CREATE POLICY "Mentors can create progress reports for their students" 
        ON public.progress_reports 
        FOR INSERT 
        WITH CHECK (
          mentor_id = auth.uid() AND
          EXISTS (
            SELECT 1 FROM public.student_mentor_assignments sma
            WHERE sma.mentor_id = auth.uid() AND sma.student_id = progress_reports.student_id
          )
        );
        
        -- Mentors can update progress reports they created
        CREATE POLICY "Mentors can update their own progress reports" 
        ON public.progress_reports 
        FOR UPDATE 
        USING (mentor_id = auth.uid());
        
        -- Students can view their own progress reports
        CREATE POLICY "Students can view their own progress reports" 
        ON public.progress_reports 
        FOR SELECT 
        USING (student_id = auth.uid());
      `

      const { error: policyError } = await supabase.rpc('exec_sql', { sql_string: policiesSQL })

      if (policyError) {
        console.warn("Error setting up RLS policies:", policyError);
        // Continue anyway as the table was created
      }

      setResult("Successfully created 'progress_reports' table.")
      toast({
        title: "Success",
        description: "Progress reports table created successfully."
      })
    } catch (error) {
      console.error("Error creating progress_reports table:", error)
      
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
        This will create a table to store student progress reports created by mentors. Mentors can create and update
        progress reports for their assigned students, and students can view their own progress reports.
      </p>
      {result && (
        <div className={`p-4 rounded-md mb-4 ${result.includes("Error") ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
          {result}
        </div>
      )}
      <Button onClick={createProgressReportsTable} disabled={loading} className="w-full">
        {loading ? (
          <>
            <LoadingSpinner size="sm" animation="spin" className="mr-2" />
            Creating Table...
          </>
        ) : (
          "Create Progress Reports Table"
        )}
      </Button>
    </div>
  )
}