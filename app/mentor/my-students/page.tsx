"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, User, BookOpen, FileText, Calendar, Clock, AlertCircle } from "lucide-react"
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
  status: string
  created_at: string
  assigned_at: string
  test_count?: number
  homework_count?: number
  meeting_count?: number
}

export default function MyStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  // Fetch assigned students when userId is available
  useEffect(() => {
    if (userId) {
      fetchAssignedStudents();
    }
  }, [userId]);

  const fetchAssignedStudents = async () => {
    if (!supabase || !userId) {
      setLoading(false);
      setError("Please log in to view your assigned students");
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching assigned students for mentor:", userId);

      // Skip the function approach and go directly to the table
      console.log("Fetching assigned students directly from the table");

      // Fallback: Get student assignments from assigned_students table
      let assignments = [];
      
      try {
        console.log("Fetching from assigned_students table...");
        
        // Fetch assignments
        try {
          console.log("Attempting to fetch assignments for mentor:", userId);
          
          console.log("Fetching assignments for mentor:", userId);
          
          // Direct query with detailed logging
          const { data, error } = await supabase
            .from("assigned_students")
            .select("id, student_id, assigned_at")
            .eq("mentor_id", userId);

          console.log("Assignment query result:", { data, error });

          if (error) {
            console.error("Could not fetch assignments:", error.message);
            throw error;
          } else if (data && data.length > 0) {
            assignments = data;
            console.log(`Found ${data.length} student assignments for mentor ${userId}`);
          } else {
            console.log("No assigned students found for mentor:", userId);
          }
        } catch (fetchErr) {
          console.log("Exception during assignment fetch:", fetchErr);
        }
      } catch (error) {
        console.error("Exception checking assignments:", error);
      }

      if (assignments.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      const studentIds = assignments.map(a => a.student_id);
      console.log(`Found ${studentIds.length} assigned students`);

      // Get student profiles
      let studentProfiles = [];
      try {
        if (studentIds.length === 0) {
          console.log("No student IDs to fetch profiles for");
          setStudents([]);
          setLoading(false);
          return;
        }
        
        console.log("Fetching student profiles for IDs:", studentIds);
        
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name, email, current_class, target_exam, status, created_at")
            .in("id", studentIds);

          if (error) {
            console.log("Could not fetch student profiles:", error.message);
            setStudents([]);
            setLoading(false);
            return;
          }

          if (data && data.length > 0) {
            studentProfiles = data;
            console.log(`Found ${data.length} student profiles`);
          } else {
            console.log("No student profiles found for the given IDs");
            setStudents([]);
            setLoading(false);
            return;
          }
        } catch (fetchErr) {
          console.log("Exception during profile fetch");
          setStudents([]);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.log("Exception in profile processing");
        setStudents([]);
        setLoading(false);
        return;
      }

      // Create a map of assignment dates
      const assignmentDates = new Map();
      assignments.forEach(a => {
        assignmentDates.set(a.student_id, a.assigned_at);
      });

      // Get test counts (if table exists)
      let testCounts = [];
      try {
        const { data, error } = await supabase
          .from("test_results")
          .select("student_id, count")
          .in("student_id", studentIds)
          .group("student_id");

        if (!error && data) {
          testCounts = data;
        }
      } catch (error) {
        console.log("Note: Could not fetch test counts");
      }

      // Get homework counts (if table exists)
      let homeworkCounts = [];
      try {
        const { data, error } = await supabase
          .from("homework_submissions")
          .select("student_id, count")
          .in("student_id", studentIds)
          .group("student_id");

        if (!error && data) {
          homeworkCounts = data;
        }
      } catch (error) {
        console.log("Note: Could not fetch homework counts");
      }

      // Get meeting counts (if table exists)
      let meetingCounts = [];
      try {
        const { data, error } = await supabase
          .from("meeting_requests")
          .select("student_id, count")
          .in("student_id", studentIds)
          .eq("status", "accepted")
          .group("student_id");

        if (!error && data) {
          meetingCounts = data;
        }
      } catch (error) {
        console.log("Note: Could not fetch meeting counts");
      }

      // Create maps for the counts
      const testCountMap = new Map();
      const homeworkCountMap = new Map();
      const meetingCountMap = new Map();

      if (testCounts) {
        testCounts.forEach(item => testCountMap.set(item.student_id, item.count));
      }

      if (homeworkCounts) {
        homeworkCounts.forEach(item => homeworkCountMap.set(item.student_id, item.count));
      }

      if (meetingCounts) {
        meetingCounts.forEach(item => meetingCountMap.set(item.student_id, item.count));
      }

      // Combine all data
      const studentsWithDetails = studentProfiles.map(student => ({
        ...student,
        assigned_at: assignmentDates.get(student.id),
        test_count: testCountMap.get(student.id) || 0,
        homework_count: homeworkCountMap.get(student.id) || 0,
        meeting_count: meetingCountMap.get(student.id) || 0
      }));

      setStudents(studentsWithDetails);
    } catch (error) {
      console.error("Error fetching assigned students:", error);
      setError("Failed to load assigned students. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load your assigned students. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.current_class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.target_exam?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">My Students</h1>
      <p className="text-gray-600 mb-8">View and manage your assigned students</p>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" animation="border" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-6">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Students</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchAssignedStudents}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-6">
              <User className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Students Assigned</h3>
              <p className="text-gray-600 mb-4">
                You don't have any students assigned to you yet. The admin will assign students to you.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students by name, email, class or exam..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Students</CardTitle>
              <CardDescription>
                You have {students.length} student{students.length !== 1 ? 's' : ''} assigned to you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class & Exam</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned On</TableHead>
                    <TableHead>Tests</TableHead>
                    <TableHead>Homework</TableHead>
                    <TableHead>Meetings</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.full_name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
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
                          {!student.current_class && !student.target_exam && "Not specified"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.status === "active" ? "default" : "secondary"}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(student.assigned_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50">
                          {student.test_count} tests
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-yellow-50">
                          {student.homework_count} submissions
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50">
                          {student.meeting_count} meetings
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/mentor/student/${student.id}`}>
                              <User className="h-3 w-3 mr-1" />
                              View
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/mentor/student/${student.id}/tests`}>
                              <FileText className="h-3 w-3 mr-1" />
                              Tests
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}