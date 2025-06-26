"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { supabase } from "@/lib/supabase/client"
import { UserPlus, Users, X, Check, AlertCircle, Search } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface User {
  id: string
  full_name: string
  email: string
  role: string
  status: string
  created_at: string
}

interface Assignment {
  id: string
  student_id: string
  mentor_id: string
  assigned_at: string
  student_name: string
  mentor_name: string
}

export default function AssignStudentsPage() {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<User[]>([])
  const [mentors, setMentors] = useState<User[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [selectedMentor, setSelectedMentor] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  // Get current user and check if admin
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
          
          // Check if user is admin
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
            
          if (profileError) {
            console.error("Error fetching user profile:", profileError);
            return;
          }
          
          if (profile && profile.role === "admin") {
            setIsAdmin(true);
            fetchData();
          } else {
            console.log("User is not an admin");
          }
        } else {
          console.log("No authenticated user found");
        }
      } catch (e) {
        console.error("Error in getCurrentUser:", e);
      } finally {
        setLoading(false);
      }
    }
    
    getCurrentUser();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, status, created_at")
        .eq("role", "student")
        .order("full_name");

      if (studentsError) {
        console.error("Error fetching students:", studentsError);
        toast({
          title: "Error",
          description: "Failed to load students",
          variant: "destructive"
        });
      } else {
        setStudents(studentsData || []);
      }

      // Fetch mentors
      const { data: mentorsData, error: mentorsError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, status, created_at")
        .eq("role", "mentor")
        .order("full_name");

      if (mentorsError) {
        console.error("Error fetching mentors:", mentorsError);
        toast({
          title: "Error",
          description: "Failed to load mentors",
          variant: "destructive"
        });
      } else {
        setMentors(mentorsData || []);
      }

      // Fetch existing assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assigned_students")
        .select(`
          id, 
          student_id, 
          mentor_id, 
          assigned_at
        `)
        .order("assigned_at", { ascending: false });

      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError);
        toast({
          title: "Error",
          description: "Failed to load existing assignments",
          variant: "destructive"
        });
        setAssignments([]);
      } else {
        // Enrich assignments with names
        const enrichedAssignments = (assignmentsData || []).map(assignment => {
          const student = studentsData?.find(s => s.id === assignment.student_id);
          const mentor = mentorsData?.find(m => m.id === assignment.mentor_id);
          
          return {
            ...assignment,
            student_name: student?.full_name || "Unknown Student",
            mentor_name: mentor?.full_name || "Unknown Mentor"
          };
        });
        
        setAssignments(enrichedAssignments);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedStudent || !selectedMentor) {
      toast({
        title: "Error",
        description: "Please select both a student and a mentor",
        variant: "destructive"
      });
      return;
    }

    // Check if assignment already exists
    const existingAssignment = assignments.find(
      a => a.student_id === selectedStudent && a.mentor_id === selectedMentor
    );

    if (existingAssignment) {
      toast({
        title: "Error",
        description: "This student is already assigned to this mentor",
        variant: "destructive"
      });
      return;
    }

    setAssigning(true);
    try {
      console.log("Assigning student:", selectedStudent, "to mentor:", selectedMentor);
      
      // Use the assign_student_to_mentor function
      const { data, error } = await supabase.rpc('assign_student_to_mentor', {
        p_student_id: selectedStudent,
        p_mentor_id: selectedMentor
      });
      
      if (error) {
        console.error("Error using assign_student_to_mentor function:", error);
        
        // Fallback: Try direct insert if function fails
        try {
          const { data: insertData, error: insertError } = await supabase
            .from("assigned_students")
            .insert([
              {
                student_id: selectedStudent,
                mentor_id: selectedMentor,
                assigned_by: userId
              }
            ])
            .select();

          if (insertError) {
            console.error("Error with direct insert:", insertError);
            throw insertError;
          }
          
          console.log("Successfully inserted using direct insert");
        } catch (insertErr) {
          console.error("Error with direct insert:", insertErr);
          throw error; // Throw the original error
        }
      } else {
        console.log("Assignment result:", data);
        
        if (data && data.success === false) {
          console.error("Function returned error:", data.message);
          toast({
            title: "Error",
            description: data.message || "Failed to assign student to mentor",
            variant: "destructive"
          });
          setAssigning(false);
          return;
        }
        
        console.log("Successfully assigned student using function");
      }
      
      toast({
        title: "Success",
        description: "Student assigned to mentor successfully"
      });

      // Reset selection
      setSelectedStudent("");
      setSelectedMentor("");

      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error in handleAssign:", error);
      toast({
        title: "Error",
        description: "Failed to assign student to mentor. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    setRemoving(assignmentId);
    try {
      // Use the remove_student_assignment function
      const { data, error } = await supabase.rpc('remove_student_assignment', {
        p_assignment_id: assignmentId
      });
      
      if (error) {
        console.error("Error using remove_student_assignment function:", error);
        
        // Fallback: Try direct delete if function fails
        try {
          const { error: deleteError } = await supabase
            .from("assigned_students")
            .delete()
            .eq("id", assignmentId);

          if (deleteError) {
            console.error("Error with direct delete:", deleteError);
            throw deleteError;
          }
          
          console.log("Successfully deleted using direct delete");
        } catch (deleteErr) {
          console.error("Error with direct delete:", deleteErr);
          throw error; // Throw the original error
        }
      } else {
        console.log("Removal result:", data);
        
        if (data && data.success === false) {
          console.error("Function returned error:", data.message);
          toast({
            title: "Error",
            description: data.message || "Failed to remove assignment",
            variant: "destructive"
          });
          setRemoving(null);
          return;
        }
        
        console.log("Successfully removed assignment using function");
      }

      toast({
        title: "Success",
        description: "Assignment removed successfully"
      });

      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error in handleRemoveAssignment:", error);
      toast({
        title: "Error",
        description: "Failed to remove assignment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRemoving(null);
    }
  };

  const filteredAssignments = searchQuery
    ? assignments.filter(
        a =>
          a.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.mentor_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : assignments;

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" animation="border" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page. Only administrators can assign students to mentors.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Assign Students to Mentors</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>New Assignment</CardTitle>
            <CardDescription>
              Select a student and a mentor to create a new assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="student">Student</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name} ({student.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mentor">Mentor</Label>
                <Select value={selectedMentor} onValueChange={setSelectedMentor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentors.map(mentor => (
                      <SelectItem key={mentor.id} value={mentor.id}>
                        {mentor.full_name} ({mentor.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleAssign} 
              disabled={!selectedStudent || !selectedMentor || assigning}
              className="w-full"
            >
              {assigning ? (
                <>
                  <LoadingSpinner size="sm" animation="spin" className="mr-2" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Student to Mentor
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>
              Overview of students and mentors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Total Mentors</p>
                <p className="text-2xl font-bold">{mentors.length}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Total Assignments</p>
                <p className="text-2xl font-bold">{assignments.length}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Students per Mentor (Avg)</p>
                <p className="text-2xl font-bold">
                  {mentors.length > 0 
                    ? (assignments.length / mentors.length).toFixed(1) 
                    : "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
          <CardDescription>
            View and manage existing student-mentor assignments
          </CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by student or mentor name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Assignments Found</h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? "No assignments match your search criteria." 
                  : "There are no student-mentor assignments yet."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.student_name}</TableCell>
                    <TableCell>{assignment.mentor_name}</TableCell>
                    <TableCell>{new Date(assignment.assigned_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        disabled={removing === assignment.id}
                      >
                        {removing === assignment.id ? (
                          <LoadingSpinner size="sm" animation="spin" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
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