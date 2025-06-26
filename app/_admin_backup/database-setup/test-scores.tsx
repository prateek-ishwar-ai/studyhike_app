"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function TestScoresSetup() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const createTestScoresTable = async () => {
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
      console.log("Starting test_results table setup...");
      
      // Create the test_results table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.test_results (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID NOT NULL,
          title TEXT NOT NULL,
          subject TEXT NOT NULL,
          score NUMERIC NOT NULL,
          max_score NUMERIC NOT NULL,
          date DATE NOT NULL,
          notes TEXT,
          created_by UUID,
          created_at TIMESTAMPTZ DEFAULT NOW()
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
        CREATE INDEX IF NOT EXISTS idx_test_results_student_id ON public.test_results(student_id);
        CREATE INDEX IF NOT EXISTS idx_test_results_date ON public.test_results(date);
      `

      const { error: indexError } = await supabase.rpc('exec_sql', { sql_string: indexesSQL })

      if (indexError) {
        console.warn("Error creating indexes:", indexError);
        // Continue anyway as the table was created
      }

      // Enable RLS and add policies
      const policiesSQL = `
        -- Enable RLS
        ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        -- Admin can do everything
        CREATE POLICY "Admin can manage all test results" 
        ON public.test_results 
        FOR ALL 
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
          )
        );
        
        -- Mentors can view test results for their assigned students
        CREATE POLICY "Mentors can view their students' test results" 
        ON public.test_results 
        FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM public.student_mentor_assignments sma
            WHERE sma.mentor_id = auth.uid() AND sma.student_id = test_results.student_id
          )
        );
        
        -- Mentors can add test results for their assigned students
        CREATE POLICY "Mentors can add test results for their students" 
        ON public.test_results 
        FOR INSERT 
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.student_mentor_assignments sma
            WHERE sma.mentor_id = auth.uid() AND sma.student_id = test_results.student_id
          )
        );
        
        -- Students can view their own test results
        CREATE POLICY "Students can view their own test results" 
        ON public.test_results 
        FOR SELECT 
        USING (student_id = auth.uid());
      `

      const { error: policyError } = await supabase.rpc('exec_sql', { sql_string: policiesSQL })

      if (policyError) {
        console.warn("Error setting up RLS policies:", policyError);
        // Continue anyway as the table was created
      }

      setResult("Successfully created 'test_results' table.")
      toast({
        title: "Success",
        description: "Test results table created successfully."
      })
    } catch (error) {
      console.error("Error creating test_results table:", error)
      
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
        This will create a table to store student test results. Mentors can add test scores for their assigned students,
        and students can view their own test results.
      </p>
      {result && (
        <div className={`p-4 rounded-md mb-4 ${result.includes("Error") ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
          {result}
        </div>
      )}
      <Button onClick={createTestScoresTable} disabled={loading} className="w-full">
        {loading ? (
          <>
            <LoadingSpinner size="sm" animation="spin" className="mr-2" />
            Creating Table...
          </>
        ) : (
          "Create Test Results Table"
        )}
      </Button>
    </div>
  )
}