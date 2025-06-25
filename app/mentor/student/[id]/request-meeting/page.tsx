"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar, Clock, Send } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"

interface Student {
  id: string
  full_name: string
  email: string
  current_class?: string
  target_exam?: string
}

export default function RequestMeetingPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [meetingData, setMeetingData] = useState({
    title: "",
    description: "",
    proposed_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    proposed_time: "15:00"
  })

  // Get current user
  useEffect(() => {
    async function getCurrentUser() {
      try {
        if (!supabase) {
          console.error("Supabase client not initialized");
          return;
        }
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Error getting user:", error.message);
          return;
        }
        
        if (user) {
          console.log("User authenticated:", user.id);
          setUserId(user.id);
        } else {
          console.log("No authenticated user found");
        }
      } catch (e) {
        console.error("Error in getCurrentUser:", e);
      }
    }
    
    getCurrentUser();
  }, []);

  // Fetch student data when userId is available
  useEffect(() => {
    if (userId && params.id) {
      fetchStudentData();
    }
  }, [userId, params.id]);

  const fetchStudentData = async () => {
    if (!supabase || !userId || !params.id) {
      setLoading(false);
      setError("Unable to load student data");
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching data for student:", params.id);

      // First verify this student is assigned to this mentor
      try {
        // First, ensure the table exists
        try {
          const createTableSQL = `
            CREATE TABLE IF NOT EXISTS public.student_mentor_assignments (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              student_id UUID NOT NULL,
              mentor_id UUID NOT NULL,
              assigned_at TIMESTAMPTZ DEFAULT NOW()
            );
          `;
          
          await supabase.rpc('exec_sql', { sql_string: createTableSQL });
          console.log("Ensured student_mentor_assignments table exists");
        } catch (err) {
          console.log("Table creation check completed");
        }
        
        // Now check assignment
        const { data: assignment, error: assignmentError } = await supabase
          .from("student_mentor_assignments")
          .select("assigned_at")
          .eq("mentor_id", userId)
          .eq("student_id", params.id)
          .single();

        if (assignmentError) {
          console.log("Error checking student assignment:", assignmentError.message);
          setError("This student is not assigned to you");
          setLoading(false);
          return;
        }
        
        if (!assignment) {
          console.log("No assignment found for this student and mentor");
          setError("This student is not assigned to you");
          setLoading(false);
          return;
        }

        // Get student profile
        const { data: studentData, error: studentError } = await supabase
          .from("profiles")
          .select("id, full_name, email, current_class, target_exam")
          .eq("id", params.id)
          .single();

        if (studentError || !studentData) {
          throw new Error("Failed to load student profile");
        }

        setStudent(studentData);
      } catch (error) {
        console.error("Error verifying student assignment:", error);
        setError("Failed to verify student assignment");
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      setError("Failed to load student data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMeetingData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!student || !userId) {
      toast({
        title: "Error",
        description: "Student data is not available",
        variant: "destructive"
      });
      return;
    }

    // Validate form
    if (!meetingData.title || !meetingData.proposed_date || !meetingData.proposed_time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate date (must be in the future)
    const proposedDate = new Date(meetingData.proposed_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (proposedDate < today) {
      toast({
        title: "Error",
        description: "The proposed date must be in the future",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // First ensure the table exists
      try {
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
        `;
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_string: createTableSQL });
          if (error) {
            console.log("Note: Table might already exist:", error.message);
          } else {
            console.log("Successfully ensured mentor_meeting_requests table exists");
          }
        } catch (err) {
          console.log("Table creation check completed with exception");
        }
      } catch (err) {
        console.log("Exception in table creation process");
      }

      // Submit the meeting request
      const { error } = await supabase
        .from("mentor_meeting_requests")
        .insert([
          {
            mentor_id: userId,
            student_id: student.id,
            title: meetingData.title,
            description: meetingData.description,
            proposed_date: meetingData.proposed_date,
            proposed_time: meetingData.proposed_time,
            status: "pending"
          }
        ]);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Meeting request has been sent to the student",
      });

      // Redirect back to student profile
      router.push(`/mentor/student/${student.id}`);
    } catch (error) {
      console.error("Error submitting meeting request:", error);
      
      toast({
        title: "Error",
        description: "Failed to send meeting request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" animation="border" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Link href="/mentor/my-students" className="flex items-center text-blue-600 mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to My Students
        </Link>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-6">
              <Calendar className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchStudentData}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container mx-auto py-8">
        <Link href="/mentor/my-students" className="flex items-center text-blue-600 mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to My Students
        </Link>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-6">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Student Not Found</h3>
              <p className="text-gray-600 mb-4">
                The student you're looking for could not be found or is not assigned to you.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <Link href={`/mentor/student/${student.id}`} className="flex items-center text-blue-600">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Student Profile
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Meeting with {student.full_name}</CardTitle>
          <CardDescription>
            Send a meeting request to your student. They will be notified and can accept or decline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Meeting Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Weekly Progress Review, Exam Preparation"
                value={meetingData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="proposed_date">Proposed Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="proposed_date"
                    name="proposed_date"
                    type="date"
                    className="pl-10"
                    value={meetingData.proposed_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="proposed_time">Proposed Time *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="proposed_time"
                    name="proposed_time"
                    type="time"
                    className="pl-10"
                    value={meetingData.proposed_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Meeting Agenda (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the purpose of the meeting and what you'd like to discuss..."
                rows={4}
                value={meetingData.description}
                onChange={handleInputChange}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" animation="spin" className="mr-2" />
                  Sending Request...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Meeting Request
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}