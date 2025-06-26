"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Copy, Database, Loader, Users, FileText, BookOpen, BarChart, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import StudentMentorAssignmentsSetup from "./student-mentor-assignments"
import TestScoresSetup from "./test-scores"
import HomeworkSubmissionsSetup from "./homework-submissions"
import ProgressReportsSetup from "./progress-reports"
import MentorMeetingRequestsSetup from "./mentor-meeting-requests"

export default function DatabaseSetupPage() {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tableCreated, setTableCreated] = useState(false)

  const meetingRequestsSQL = `-- Create meeting_requests table
CREATE TABLE IF NOT EXISTS public.meeting_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    topic TEXT NOT NULL,
    preferred_time TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    accepted_by UUID,
    scheduled_time TIMESTAMPTZ,
    meet_link TEXT
);

-- Enable RLS
ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Students can create meeting requests
CREATE POLICY "Students can create meeting requests" 
ON public.meeting_requests 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

-- Students can view their meeting requests
CREATE POLICY "Students can view their meeting requests" 
ON public.meeting_requests 
FOR SELECT 
USING (auth.uid() = student_id);

-- Mentors can view pending requests
CREATE POLICY "Mentors can view pending requests" 
ON public.meeting_requests 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles u 
        WHERE u.id = auth.uid() AND u.role = 'mentor'
    ) 
    AND status = 'pending'
);

-- Mentors can accept pending requests
CREATE POLICY "Mentors can accept pending requests" 
ON public.meeting_requests 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles u 
        WHERE u.id = auth.uid() AND u.role = 'mentor'
    ) 
    AND status = 'pending'
);

-- Mentors can view accepted requests they've accepted
CREATE POLICY "Mentors can view accepted requests they've accepted" 
ON public.meeting_requests 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles u 
        WHERE u.id = auth.uid() AND u.role = 'mentor'
    ) 
    AND accepted_by = auth.uid()
);

-- Admin can view all meeting requests
CREATE POLICY "Admin can view all meeting requests" 
ON public.meeting_requests 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles u 
        WHERE u.id = auth.uid() AND u.role = 'admin'
    )
);`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(meetingRequestsSQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const createTable = async () => {
    if (!supabase) {
      toast({
        title: "Error",
        description: "Supabase client not initialized",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // This will only work if the user has admin privileges
      const { error } = await supabase.rpc('exec_sql', { sql_string: meetingRequestsSQL })
      
      if (error) {
        toast({
          title: "Error",
          description: `Failed to create table: ${error.message}. You may not have admin privileges.`,
          variant: "destructive"
        })
      } else {
        setTableCreated(true)
        toast({
          title: "Success",
          description: "Table created successfully!",
        })
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: `Unexpected error: ${e.message}`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Database Setup Instructions</h1>
      
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Database Setup Required</AlertTitle>
        <AlertDescription>
          Several features require database tables to be created. Please follow the instructions below or use the automated setup.
        </AlertDescription>
      </Alert>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Automated Database Setup
          </CardTitle>
          <CardDescription>
            Use the automated setup to create all required tables and functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            The automated setup will create all the necessary tables and functions for the application to work properly,
            including student-mentor assignments and meeting requests.
          </p>
          <Link href="/admin/database-setup/setup-tables">
            <Button>
              <Database className="h-4 w-4 mr-2" />
              Run Automated Setup
            </Button>
          </Link>
        </CardContent>
      </Card>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Meeting Requests Table Setup
          </CardTitle>
          <CardDescription>
            Execute the following SQL in your Supabase SQL Editor to create the meeting_requests table
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Textarea
              className="font-mono text-sm h-96"
              readOnly
              value={meetingRequestsSQL}
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2"
              onClick={copyToClipboard}
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
          
          <div className="mt-4 space-y-4">
            <div className="flex flex-col space-y-4">
              <Button 
                onClick={createTable} 
                disabled={loading || tableCreated}
                className="w-full md:w-auto"
              >
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Creating Table...
                  </>
                ) : tableCreated ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Table Created Successfully
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Create Table Now
                  </>
                )}
              </Button>
              
              <p className="text-sm text-gray-500">
                This will attempt to create the table directly in your database. You need admin privileges for this to work.
              </p>
            </div>
            
            <h3 className="text-lg font-medium mt-6">Manual Instructions:</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Log in to your Supabase dashboard</li>
              <li>Go to the SQL Editor</li>
              <li>Create a new query</li>
              <li>Paste the SQL above</li>
              <li>Run the query</li>
              <li>Verify that the table was created successfully</li>
            </ol>
            
            <Alert>
              <AlertDescription>
                After creating the table, the meeting requests feature will be available to students and mentors.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
      
      {/* Student-Mentor Assignments Table Setup */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Student-Mentor Assignments
          </CardTitle>
          <CardDescription>
            Create a table to manage student-mentor relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentMentorAssignmentsSetup />
        </CardContent>
      </Card>
      
      {/* Test Scores Table Setup */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Test Scores
          </CardTitle>
          <CardDescription>
            Create a table to store student test results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TestScoresSetup />
        </CardContent>
      </Card>
      
      {/* Homework Submissions Table Setup */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Homework Submissions
          </CardTitle>
          <CardDescription>
            Create a table and storage buckets for homework submissions and feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HomeworkSubmissionsSetup />
        </CardContent>
      </Card>
      
      {/* Progress Reports Table Setup */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Progress Reports
          </CardTitle>
          <CardDescription>
            Create a table to store student progress reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressReportsSetup />
        </CardContent>
      </Card>
      
      {/* Mentor Meeting Requests Table Setup */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mentor Meeting Requests
          </CardTitle>
          <CardDescription>
            Create a table for mentor-initiated meeting requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MentorMeetingRequestsSetup />
        </CardContent>
      </Card>
    </div>
  )
}