"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function StudentMentorAssignmentsSetup() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const createStudentMentorAssignmentsTable = async () => {
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
      console.log("Starting student-mentor assignments table setup...");
      
      // We'll just try to create the table directly
      // If it already exists, the CREATE IF NOT EXISTS will handle it
      console.log("Creating student_mentor_assignments table...");

      // Create both tables for compatibility
      const createTableSQL = `
        -- Create the assigned_students table (new structure)
        CREATE TABLE IF NOT EXISTS public.assigned_students (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID NOT NULL,
          mentor_id UUID NOT NULL,
          assigned_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(student_id, mentor_id)
        );
        
        -- Also create the student_mentor_assignments table for backward compatibility
        CREATE TABLE IF NOT EXISTS public.student_mentor_assignments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID NOT NULL,
          mentor_id UUID NOT NULL,
          assigned_at TIMESTAMPTZ DEFAULT NOW()
        );
      `

      // First try to create just the table
      const { error: createTableError } = await supabase.rpc('exec_sql', { sql_string: createTableSQL })
      
      if (createTableError) {
        console.error("Error creating table:", createTableError);
        
        // Try an alternative approach
        try {
          const simpleCreateSQL = `
            CREATE TABLE IF NOT EXISTS student_mentor_assignments (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              student_id UUID NOT NULL,
              mentor_id UUID NOT NULL,
              assigned_at TIMESTAMPTZ DEFAULT NOW()
            );
          `;
          
          await supabase.rpc('exec_sql', { sql_string: simpleCreateSQL });
          console.log("Tried alternative table creation approach");
        } catch (altError) {
          console.error("Alternative approach also failed:", altError);
        }
      }

      if (createTableError) {
        console.error("Error creating table:", createTableError);
        throw new Error(`Failed to create table: ${createTableError.message}`);
      }

      console.log("Table created successfully, now adding indexes and policies...");

      // Add indexes
      const indexesSQL = `
        -- Add indexes for performance on both tables
        CREATE INDEX IF NOT EXISTS idx_student_mentor_assignments_student_id ON public.student_mentor_assignments(student_id);
        CREATE INDEX IF NOT EXISTS idx_student_mentor_assignments_mentor_id ON public.student_mentor_assignments(mentor_id);
        
        CREATE INDEX IF NOT EXISTS idx_assigned_students_student_id ON public.assigned_students(student_id);
        CREATE INDEX IF NOT EXISTS idx_assigned_students_mentor_id ON public.assigned_students(mentor_id);
      `

      const { error: indexError } = await supabase.rpc('exec_sql', { sql_string: indexesSQL })

      if (indexError) {
        console.warn("Error creating indexes:", indexError);
        // Continue anyway as the table was created
      }

      // Enable RLS and add policies
      const policiesSQL = `
        -- Enable RLS on both tables
        ALTER TABLE public.student_mentor_assignments ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.assigned_students ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for student_mentor_assignments
        -- Admin can do everything
        CREATE POLICY IF NOT EXISTS "Admin can manage all assignments" 
        ON public.student_mentor_assignments 
        FOR ALL 
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
          )
        );
        
        -- Mentors can view their own assignments
        CREATE POLICY IF NOT EXISTS "Mentors can view their own assignments" 
        ON public.student_mentor_assignments 
        FOR SELECT 
        USING (mentor_id = auth.uid());
        
        -- Students can view their own assignments
        CREATE POLICY IF NOT EXISTS "Students can view their own assignments" 
        ON public.student_mentor_assignments 
        FOR SELECT 
        USING (student_id = auth.uid());
        
        -- Create policies for assigned_students
        -- Admin can do everything
        CREATE POLICY IF NOT EXISTS "Admin can manage all assignments" 
        ON public.assigned_students 
        FOR ALL 
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
          )
        );
        
        -- Mentors can view their own assignments
        CREATE POLICY IF NOT EXISTS "Mentors can view their assigned students" 
        ON public.assigned_students 
        FOR SELECT 
        USING (mentor_id = auth.uid());
        
        -- Students can view their own assignments
        CREATE POLICY IF NOT EXISTS "Students can view their assigned mentor" 
        ON public.assigned_students 
        FOR SELECT 
        USING (student_id = auth.uid());
      `

      const { error: policyError } = await supabase.rpc('exec_sql', { sql_string: policiesSQL })

      if (policyError) {
        console.warn("Error setting up RLS policies:", policyError);
        // Continue anyway as the table was created
      }

      setResult("Successfully created 'assigned_students' and 'student_mentor_assignments' tables.")
      toast({
        title: "Success",
        description: "Student-mentor assignments table created successfully."
      })
    } catch (error) {
      console.error("Error creating student_mentor_assignments table:", error)
      
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
        This will create a table to track which students are assigned to which mentors.
        The table enables admins to assign students to mentors and allows mentors to view their assigned students.
      </p>
      {result && (
        <div className={`p-4 rounded-md mb-4 ${result.includes("Error") ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
          {result}
        </div>
      )}
      <Button onClick={createStudentMentorAssignmentsTable} disabled={loading} className="w-full">
        {loading ? (
          <>
            <LoadingSpinner size="sm" animation="spin" className="mr-2" />
            Creating Table...
          </>
        ) : (
          "Create Student-Mentor Assignments Table"
        )}
      </Button>
    </div>
  )
}