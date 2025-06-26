"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Database, Loader } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"

export default function SetupTablesPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const setupTables = async () => {
    setLoading(true)
    setResult(null)
    setSuccess(false)

    try {
      // Create the student_mentor_assignments table
      const createStudentMentorAssignmentsTable = `
        CREATE TABLE IF NOT EXISTS public.student_mentor_assignments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID NOT NULL,
          mentor_id UUID NOT NULL,
          assigned_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(student_id, mentor_id)
        );

        -- Add indexes for performance
        CREATE INDEX IF NOT EXISTS idx_student_mentor_assignments_student_id 
        ON public.student_mentor_assignments(student_id);

        CREATE INDEX IF NOT EXISTS idx_student_mentor_assignments_mentor_id 
        ON public.student_mentor_assignments(mentor_id);

        -- Enable RLS
        ALTER TABLE public.student_mentor_assignments ENABLE ROW LEVEL SECURITY;

        -- Create policies
        -- Admin can do everything
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'student_mentor_assignments' 
            AND policyname = 'Admin can manage all assignments'
          ) THEN
            CREATE POLICY "Admin can manage all assignments" 
            ON public.student_mentor_assignments 
            FOR ALL 
            USING (
              EXISTS (
                SELECT 1 FROM public.profiles u 
                WHERE u.id = auth.uid() AND u.role = 'admin'
              )
            );
          END IF;
        END
        $$;

        -- Mentors can view their own assignments
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'student_mentor_assignments' 
            AND policyname = 'Mentors can view their own assignments'
          ) THEN
            CREATE POLICY "Mentors can view their own assignments" 
            ON public.student_mentor_assignments 
            FOR SELECT 
            USING (mentor_id = auth.uid());
          END IF;
        END
        $$;

        -- Students can view their own assignments
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'student_mentor_assignments' 
            AND policyname = 'Students can view their own assignments'
          ) THEN
            CREATE POLICY "Students can view their own assignments" 
            ON public.student_mentor_assignments 
            FOR SELECT 
            USING (student_id = auth.uid());
          END IF;
        END
        $$;
      `;

      const { error: assignmentsTableError } = await supabase.rpc('exec_sql', { 
        sql_string: createStudentMentorAssignmentsTable 
      });

      if (assignmentsTableError) {
        console.error("Error creating student_mentor_assignments table:", assignmentsTableError);
        setResult(`Error creating student_mentor_assignments table: ${assignmentsTableError.message}`);
        return;
      }

      // Create the assign_student_to_mentor function
      const createAssignStudentFunction = `
        -- Create a function to assign a student to a mentor
        CREATE OR REPLACE FUNCTION public.assign_student_to_mentor(
          p_student_id UUID,
          p_mentor_id UUID
        )
        RETURNS json
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          v_id UUID;
        BEGIN
          -- Check if the user is an admin
          IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
          ) THEN
            RAISE EXCEPTION 'Permission denied: Only admins can assign students to mentors';
          END IF;

          -- Check if the student exists
          IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = p_student_id AND role = 'student'
          ) THEN
            RAISE EXCEPTION 'Student with ID % not found', p_student_id;
          END IF;

          -- Check if the mentor exists
          IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = p_mentor_id AND role = 'mentor'
          ) THEN
            RAISE EXCEPTION 'Mentor with ID % not found', p_mentor_id;
          END IF;

          -- Check if the assignment already exists
          IF EXISTS (
            SELECT 1 FROM public.student_mentor_assignments 
            WHERE student_id = p_student_id AND mentor_id = p_mentor_id
          ) THEN
            RAISE EXCEPTION 'This student is already assigned to this mentor';
          END IF;

          -- Insert the assignment
          INSERT INTO public.student_mentor_assignments (student_id, mentor_id)
          VALUES (p_student_id, p_mentor_id)
          RETURNING id INTO v_id;

          -- Return success
          RETURN json_build_object(
            'success', true,
            'message', 'Student assigned to mentor successfully',
            'id', v_id
          );
        EXCEPTION
          WHEN others THEN
            -- Return the error message
            RETURN json_build_object(
              'success', false,
              'message', SQLERRM
            );
        END;
        $$;

        -- Set the security for the function
        REVOKE ALL ON FUNCTION public.assign_student_to_mentor(UUID, UUID) FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION public.assign_student_to_mentor(UUID, UUID) TO authenticated;
      `;

      const { error: assignFunctionError } = await supabase.rpc('exec_sql', { 
        sql_string: createAssignStudentFunction 
      });

      if (assignFunctionError) {
        console.error("Error creating assign_student_to_mentor function:", assignFunctionError);
        setResult(`Error creating assign_student_to_mentor function: ${assignFunctionError.message}`);
        return;
      }

      // Create the remove_student_assignment function
      const createRemoveAssignmentFunction = `
        -- Create a function to remove a student assignment
        CREATE OR REPLACE FUNCTION public.remove_student_assignment(
          p_assignment_id UUID
        )
        RETURNS json
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          v_exists BOOLEAN;
        BEGIN
          -- Check if the user is an admin
          IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
          ) THEN
            RAISE EXCEPTION 'Permission denied: Only admins can remove student assignments';
          END IF;

          -- Check if the assignment exists
          SELECT EXISTS (
            SELECT 1 FROM public.student_mentor_assignments 
            WHERE id = p_assignment_id
          ) INTO v_exists;

          IF NOT v_exists THEN
            RAISE EXCEPTION 'Assignment with ID % not found', p_assignment_id;
          END IF;

          -- Delete the assignment
          DELETE FROM public.student_mentor_assignments 
          WHERE id = p_assignment_id;

          -- Return success
          RETURN json_build_object(
            'success', true,
            'message', 'Student assignment removed successfully'
          );
        EXCEPTION
          WHEN others THEN
            -- Return the error message
            RETURN json_build_object(
              'success', false,
              'message', SQLERRM
            );
        END;
        $$;

        -- Set the security for the function
        REVOKE ALL ON FUNCTION public.remove_student_assignment(UUID) FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION public.remove_student_assignment(UUID) TO authenticated;
      `;

      const { error: removeFunctionError } = await supabase.rpc('exec_sql', { 
        sql_string: createRemoveAssignmentFunction 
      });

      if (removeFunctionError) {
        console.error("Error creating remove_student_assignment function:", removeFunctionError);
        setResult(`Error creating remove_student_assignment function: ${removeFunctionError.message}`);
        return;
      }

      // Create the get_mentor_students function
      const createGetMentorStudentsFunction = `
        -- Create a function to get all students assigned to a mentor
        CREATE OR REPLACE FUNCTION public.get_mentor_students(
          p_mentor_id UUID DEFAULT auth.uid()
        )
        RETURNS json
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          v_result json;
        BEGIN
          -- Check if the user is authorized (admin or the mentor themselves)
          IF NOT (
            EXISTS (
              SELECT 1 FROM public.profiles 
              WHERE id = auth.uid() AND role = 'admin'
            ) OR auth.uid() = p_mentor_id
          ) THEN
            RAISE EXCEPTION 'Permission denied: You can only view your own students or you must be an admin';
          END IF;

          -- Get all students assigned to this mentor with their profile information
          SELECT json_agg(
            json_build_object(
              'id', p.id,
              'full_name', p.full_name,
              'email', p.email,
              'current_class', p.current_class,
              'target_exam', p.target_exam,
              'status', p.status,
              'created_at', p.created_at,
              'assigned_at', a.assigned_at,
              'assignment_id', a.id
            )
          )
          INTO v_result
          FROM public.student_mentor_assignments a
          JOIN public.profiles p ON a.student_id = p.id
          WHERE a.mentor_id = p_mentor_id;

          -- Return the result
          RETURN COALESCE(v_result, '[]'::json);
        EXCEPTION
          WHEN others THEN
            -- Return the error message
            RETURN json_build_object(
              'error', SQLERRM
            );
        END;
        $$;

        -- Set the security for the function
        REVOKE ALL ON FUNCTION public.get_mentor_students(UUID) FROM PUBLIC;
        GRANT EXECUTE ON FUNCTION public.get_mentor_students(UUID) TO authenticated;
      `;

      const { error: getMentorStudentsFunctionError } = await supabase.rpc('exec_sql', { 
        sql_string: createGetMentorStudentsFunction 
      });

      if (getMentorStudentsFunctionError) {
        console.error("Error creating get_mentor_students function:", getMentorStudentsFunctionError);
        setResult(`Error creating get_mentor_students function: ${getMentorStudentsFunctionError.message}`);
        return;
      }

      setSuccess(true);
      setResult("All tables and functions created successfully!");
      toast({
        title: "Success",
        description: "Database setup completed successfully",
      });
    } catch (error: any) {
      console.error("Error setting up database:", error);
      setResult(`Error setting up database: ${error.message}`);
      toast({
        title: "Error",
        description: "Failed to set up database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Database Setup</h1>
      
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          This page will set up the necessary database tables and functions for the student-mentor assignment functionality.
          You need to be logged in as an admin to perform this setup.
        </AlertDescription>
      </Alert>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Setup Student-Mentor Assignment Tables
          </CardTitle>
          <CardDescription>
            This will create the necessary tables and functions for assigning students to mentors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert className={`mb-6 ${success ? "bg-green-50" : "bg-red-50"}`}>
              {success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle>{success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription className={success ? "text-green-700" : "text-red-700"}>
                {result}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col space-y-4">
            <Button 
              onClick={setupTables} 
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" animation="spin" className="mr-2" />
                  Setting Up Database...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Setup Database Tables
                </>
              )}
            </Button>
            
            {success && (
              <div className="flex flex-col space-y-4 mt-4">
                <p className="text-green-700">
                  Database setup completed successfully! You can now:
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/admin/assign-students">
                    <Button variant="outline">
                      Go to Assign Students
                    </Button>
                  </Link>
                  <Link href="/admin/database-setup">
                    <Button variant="outline">
                      Back to Database Setup
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}