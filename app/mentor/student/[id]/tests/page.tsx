"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, FileText, XCircle, PlusCircle, BarChart } from "lucide-react"
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

interface Test {
  id: string
  title: string
  subject: string
  score: number
  max_score: number
  date: string
  notes?: string
}

export default function StudentTestsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  // Unwrap params with React.use()
  const unwrappedParams = use(params)
  const studentId = unwrappedParams.id
  
  const [student, setStudent] = useState<Student | null>(null)
  const [tests, setTests] = useState<Test[]>([])
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
    if (userId && studentId) {
      fetchStudentAndTests();
    }
  }, [userId, studentId]);

  const fetchStudentAndTests = async () => {
    if (!supabase || !userId || !studentId) {
      setLoading(false);
      setError("Unable to load student data");
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching data for student:", studentId);

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
          .eq("student_id", studentId)
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
          .eq("id", studentId)
          .single();

        if (studentError || !studentData) {
          throw new Error("Failed to load student profile");
        }

        setStudent(studentData);

        // Get test results (if table exists)
        try {
          const { data: testData, error: testError } = await supabase
            .from("test_results")
            .select("id, title, subject, score, max_score, date, notes")
            .eq("student_id", studentId)
            .order("date", { ascending: false });

          if (testError) {
            console.log("Error fetching test results:", testError);
            // Check if table doesn't exist
            if (testError.code === "42P01") {
              console.log("Test results table doesn't exist yet");
              setTests([]);
            } else {
              throw testError;
            }
          } else if (testData) {
            setTests(testData);
          } else {
            setTests([]);
          }
        } catch (error) {
          console.log("Exception fetching test results:", error);
          setTests([]);
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

  const getScoreBadge = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "bg-green-100 text-green-800";
    if (percentage >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const addTestResult = () => {
    router.push(`/mentor/student/${studentId}/add-test`);
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
              <Button onClick={fetchStudentAndTests}>Try Again</Button>
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
              <FileText className="h-12 w-12 text-gray-400 mb-4" />
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
        <Button onClick={addTestResult}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Test Result
        </Button>
      </div>

      {/* Student Info */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{student.full_name}'s Test Results</CardTitle>
              <CardDescription>
                View and manage test results for this student
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">{student.email}</div>
              <div className="mt-1 space-x-2">
                {student.current_class && (
                  <Badge variant="outline" className="bg-blue-50">
                    Class: {student.current_class}
                  </Badge>
                )}
                {student.target_exam && (
                  <Badge variant="outline" className="bg-purple-50">
                    Exam: {student.target_exam}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tests.length > 0
                ? `${Math.round(
                    (tests.reduce((sum, test) => sum + (test.score / test.max_score) * 100, 0) /
                      tests.length)
                  )}%`
                : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tests.length > 0
                ? `${Math.round(
                    Math.max(...tests.map(test => (test.score / test.max_score) * 100))
                  )}%`
                : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tests.length > 0
                ? new Date(tests[0].date).toLocaleDateString()
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Test Results</CardTitle>
            <Button variant="outline" size="sm">
              <BarChart className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </div>
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
                  <TableHead>Percentage</TableHead>
                  <TableHead>Notes</TableHead>
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
                        {test.score}/{test.max_score}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getScoreBadge(test.score, test.max_score)}>
                        {Math.round((test.score / test.max_score) * 100)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {test.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}