"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function MentorMeetingRequestsSetup() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const createMentorMeetingRequestsTable = async () => {
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
      console.log("Starting mentor_meeting_requests table setup...");
      
      // Create the mentor_meeting_requests table
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.mentor_meeting_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          mentor_id UUID NOT NULL,
          student_id UUID NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          proposed_date DATE NOT NULL,
          proposed_time TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
          student_response TEXT,
          meeting_link TEXT,
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
        CREATE INDEX IF NOT EXISTS idx_mentor_meeting_requests_mentor_id ON public.mentor_meeting_requests(mentor_id);
        CREATE INDEX IF NOT EXISTS idx_mentor_meeting_requests_student_id ON public.mentor_meeting_requests(student_id);
        CREATE INDEX IF NOT EXISTS idx_mentor_meeting_requests_status ON public.mentor_meeting_requests(status);
      `

      const { error: indexError } = await supabase.rpc('exec_sql', { sql_string: indexesSQL })

      if (indexError) {
        console.warn("Error creating indexes:", indexError);
        // Continue anyway as the table was created
      }

      // Enable RLS and add policies
      const policiesSQL = `
        -- Enable RLS
        ALTER TABLE public.mentor_meeting_requests ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        -- Admin can do everything
        CREATE POLICY "Admin can manage all mentor meeting requests" 
        ON public.mentor_meeting_requests 
        FOR ALL 
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
          )
        );
        
        -- Mentors can view meeting requests they created
        CREATE POLICY "Mentors can view meeting requests they created" 
        ON public.mentor_meeting_requests 
        FOR SELECT 
        USING (mentor_id = auth.uid());
        
        -- Mentors can create meeting requests for their assigned students
        CREATE POLICY "Mentors can create meeting requests for their students" 
        ON public.mentor_meeting_requests 
        FOR INSERT 
        WITH CHECK (
          mentor_id = auth.uid() AND
          EXISTS (
            SELECT 1 FROM public.student_mentor_assignments sma
            WHERE sma.mentor_id = auth.uid() AND sma.student_id = mentor_meeting_requests.student_id
          )
        );
        
        -- Mentors can update meeting requests they created
        CREATE POLICY "Mentors can update their own meeting requests" 
        ON public.mentor_meeting_requests 
        FOR UPDATE 
        USING (mentor_id = auth.uid());
        
        -- Students can view meeting requests for them
        CREATE POLICY "Students can view their own meeting requests" 
        ON public.mentor_meeting_requests 
        FOR SELECT 
        USING (student_id = auth.uid());
        
        -- Students can update meeting requests to respond
        CREATE POLICY "Students can respond to meeting requests" 
        ON public.mentor_meeting_requests 
        FOR UPDATE 
        USING (student_id = auth.uid());
      `

      const { error: policyError } = await supabase.rpc('exec_sql', { sql_string: policiesSQL })

      if (policyError) {
        console.warn("Error setting up RLS policies:", policyError);
        // Continue anyway as the table was created
      }

      setResult("Successfully created 'mentor_meeting_requests' table.")
      toast({
        title: "Success",
        description: "Mentor meeting requests table created successfully."
      })
    } catch (error) {
      console.error("Error creating mentor_meeting_requests table:", error)
      
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
        This will create a table to store meeting requests initiated by mentors. Mentors can request meetings with
        their assigned students, and students can respond to these requests.
      </p>
      {result && (
        <div className={`p-4 rounded-md mb-4 ${result.includes("Error") ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
          {result}
        </div>
      )}
      <Button onClick={createMentorMeetingRequestsTable} disabled={loading} className="w-full">
        {loading ? (
          <>
            <LoadingSpinner size="sm" animation="spin" className="mr-2" />
            Creating Table...
          </>
        ) : (
          "Create Mentor Meeting Requests Table"
        )}
      </Button>
    </div>
  )
}