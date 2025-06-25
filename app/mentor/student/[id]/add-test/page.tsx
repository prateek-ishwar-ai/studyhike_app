"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, FileText, Save } from "lucide-react"
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

export default function AddTestResultPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [testData, setTestData] = useState({
    title: "",
    subject: "",
    score: "",
    max_score: "100",
    date: new Date().toISOString().split('T')[0],
    notes: ""
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
    setTestData(prev => ({ ...prev, [name]: value }));
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
    if (!testData.title || !testData.subject || !testData.score || !testData.max_score || !testData.date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate score
    const score = parseFloat(testData.score);
    const maxScore = parseFloat(testData.max_score);
    
    if (isNaN(score) || isNaN(maxScore)) {
      toast({
        title: "Error",
        description: "Score and max score must be valid numbers",
        variant: "destructive"
      });
      return;
    }

    if (score < 0 || maxScore <= 0 || score > maxScore) {
      toast({
        title: "Error",
        description: "Score must be between 0 and max score, and max score must be positive",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // First ensure the table exists
      try {
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
        `;
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_string: createTableSQL });
          if (error) {
            console.log("Note: Table might already exist:", error.message);
          } else {
            console.log("Successfully ensured test_results table exists");
          }
        } catch (err) {
          console.log("Table creation check completed with exception");
        }
      } catch (err) {
        console.log("Exception in table creation process");
      }

      // Submit the test result
      const { error } = await supabase
        .from("test_results")
        .insert([
          {
            student_id: student.id,
            title: testData.title,
            subject: testData.subject,
            score: parseFloat(testData.score),
            max_score: parseFloat(testData.max_score),
            date: testData.date,
            notes: testData.notes,
            created_by: userId
          }
        ]);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Test result has been added successfully",
      });

      // Redirect back to student tests page
      router.push(`/mentor/student/${student.id}/tests`);
    } catch (error) {
      console.error("Error submitting test result:", error);
      
      toast({
        title: "Error",
        description: "Failed to add test result. Please try again.",
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
              <FileText className="h-12 w-12 text-red-500 mb-4" />
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
        <Link href={`/mentor/student/${student.id}/tests`} className="flex items-center text-blue-600">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Test Results
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Test Result for {student.full_name}</CardTitle>
          <CardDescription>
            Enter the details of the test result to add to the student's record
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Test Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Midterm Exam, Chapter 5 Quiz"
                  value={testData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  name="subject"
                  placeholder="e.g., Mathematics, Physics"
                  value={testData.subject}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="score">Score *</Label>
                <Input
                  id="score"
                  name="score"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 85"
                  value={testData.score}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_score">Maximum Score *</Label>
                <Input
                  id="max_score"
                  name="max_score"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g., 100"
                  value={testData.max_score}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Test Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={testData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Add any additional notes about the test result..."
                rows={4}
                value={testData.notes}
                onChange={handleInputChange}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" animation="spin" className="mr-2" />
                  Saving Test Result...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Test Result
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}