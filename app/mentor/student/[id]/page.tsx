"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User, FileText, Calendar, Clock, ArrowLeft, BookOpen, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Link from "next/link"

interface Student {
  id: string
  full_name: string
  email: string
  phone?: string
  current_class?: string
  target_exam?: string
  status: string
  created_at: string
  assigned_at: string
}

interface Test {
  id: string
  title: string
  subject: string
  score: number
  max_score: number
  date: string
}

interface Homework {
  id: string
  title: string
  subject: string
  status: string
  submitted_at: string
  grade?: string
}

interface Meeting {
  id: string
  title: string
  date: string
  time: string
  status: string
  notes?: string
}

export default function StudentDetailPage({ params }: { params: { id: string } }) {
  const [student, setStudent] = useState<Student | null>(null)
  const [tests, setTests] = useState<Test[]>([])
  const [homework, setHomework] = useState<Homework[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

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

        console.log("Student is assigned to this mentor since:", assignment.assigned_at);
        
        // Get student profile
        const { data: studentData, error: studentError } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone, current_class, target_exam, status, created_at")
          .eq("id", params.id)
          .single();

        if (studentError || !studentData) {
          throw new Error("Failed to load student profile");
        }

        setStudent({
          ...studentData,
          assigned_at: assignment.assigned_at
        });

        // Get test results (if table exists)
        try {
          const { data: testData } = await supabase
            .from("test_results")
            .select("id, title, subject, score, max_score, date")
            .eq("student_id", params.id)
            .order("date", { ascending: false });

          if (testData) {
            setTests(testData);
          }
        } catch (error) {
          console.log("Note: Could not fetch test results");
        }

        // Get homework submissions (if table exists)
        try {
          const { data: homeworkData } = await supabase
            .from("homework_submissions")
            .select("id, title, subject, status, submitted_at, grade")
            .eq("student_id", params.id)
            .order("submitted_at", { ascending: false });

          if (homeworkData) {
            setHomework(homeworkData);
          }
        } catch (error) {
          console.log("Note: Could not fetch homework submissions");
        }

        // Get meeting requests (if table exists)
        try {
          const { data: meetingData } = await supabase
            .from("meeting_requests")
            .select("id, title, date, time, status, notes")
            .eq("student_id", params.id)
            .order("date", { ascending: false });

          if (meetingData) {
            setMeetings(meetingData);
          }
        } catch (error) {
          console.log("Note: Could not fetch meeting requests");
        }
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

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
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
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
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
              <User className="h-12 w-12 text-gray-400 mb-4" />
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
        <Link href="/mentor/my-students" className="flex items-center text-blue-600">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to My Students
        </Link>
        <Link href={`/mentor/student/${params.id}/request-meeting`}>
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Request Meeting
          </Button>
        </Link>
      </div>

      {/* Student Profile */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Student Profile</CardTitle>
          <CardDescription>
            Assigned to you on {new Date(student.assigned_at).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">{student.full_name}</h3>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="font-medium w-24">Email:</span>
                  <span>{student.email}</span>
                </div>
                {student.phone && (
                  <div className="flex items-start">
                    <span className="font-medium w-24">Phone:</span>
                    <span>{student.phone}</span>
                  </div>
                )}
                <div className="flex items-start">
                  <span className="font-medium w-24">Status:</span>
                  <Badge variant={student.status === "active" ? "default" : "secondary"}>
                    {student.status}
                  </Badge>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-24">Joined:</span>
                  <span>{new Date(student.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Academic Information</h3>
              <div className="space-y-2">
                <div className="flex items-start">
                  <span className="font-medium w-24">Class:</span>
                  <span>{student.current_class || "Not specified"}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-24">Target Exam:</span>
                  <span>{student.target_exam || "Not specified"}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-24">Tests:</span>
                  <span>{tests.length} completed</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium w-24">Homework:</span>
                  <span>{homework.length} submissions</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Tests, Homework, and Meetings */}
      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tests">
            <FileText className="h-4 w-4 mr-2" />
            Tests
          </TabsTrigger>
          <TabsTrigger value="homework">
            <BookOpen className="h-4 w-4 mr-2" />
            Homework
          </TabsTrigger>
          <TabsTrigger value="meetings">
            <Calendar className="h-4 w-4 mr-2" />
            Meetings
          </TabsTrigger>
        </TabsList>

        {/* Tests Tab */}
        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                View all test results for {student.full_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tests.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Test Results</h3>
                  <p className="text-gray-600">
                    This student hasn't taken any tests yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.title}</TableCell>
                        <TableCell>{test.subject}</TableCell>
                        <TableCell>{new Date(test.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className={getScoreColor(test.score, test.max_score)}>
                            {test.score}/{test.max_score} ({Math.round((test.score / test.max_score) * 100)}%)
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Homework Tab */}
        <TabsContent value="homework">
          <Card>
            <CardHeader>
              <CardTitle>Homework Submissions</CardTitle>
              <CardDescription>
                View all homework submissions for {student.full_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {homework.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Homework Submissions</h3>
                  <p className="text-gray-600">
                    This student hasn't submitted any homework yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {homework.map((hw) => (
                      <TableRow key={hw.id}>
                        <TableCell className="font-medium">{hw.title}</TableCell>
                        <TableCell>{hw.subject}</TableCell>
                        <TableCell>{new Date(hw.submitted_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant={hw.status === "graded" ? "default" : "secondary"}>
                            {hw.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{hw.grade || "Not graded"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meetings Tab */}
        <TabsContent value="meetings">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Requests</CardTitle>
              <CardDescription>
                View all meeting requests from {student.full_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Meeting Requests</h3>
                  <p className="text-gray-600">
                    This student hasn't requested any meetings yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {meetings.map((meeting) => (
                      <TableRow key={meeting.id}>
                        <TableCell className="font-medium">{meeting.title}</TableCell>
                        <TableCell>{new Date(meeting.date).toLocaleDateString()}</TableCell>
                        <TableCell>{meeting.time}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              meeting.status === "accepted" ? "default" : 
                              meeting.status === "pending" ? "secondary" : 
                              "destructive"
                            }
                          >
                            {meeting.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {meeting.status === "pending" && (
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Accept
                              </Button>
                              <Button size="sm" variant="outline">
                                <XCircle className="h-3 w-3 mr-1" />
                                Decline
                              </Button>
                            </div>
                          )}
                          {meeting.status === "accepted" && (
                            <Button size="sm" variant="outline">
                              <Calendar className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}