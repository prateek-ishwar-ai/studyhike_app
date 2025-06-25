"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Search, Users, Mail, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Student {
  assignment_id: string
  student_id: string
  student_name: string
  student_email: string
  assigned_at: string
}

export function MentorStudents() {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function getCurrentUser() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.error("Error getting user:", error.message)
          return
        }
        
        if (user) {
          setUserId(user.id)
          fetchAssignedStudents(user.id)
        }
      } catch (e) {
        console.error("Error in getCurrentUser:", e)
      } finally {
        setLoading(false)
      }
    }
    
    getCurrentUser()
  }, [])

  const fetchAssignedStudents = async (mentorId: string) => {
    setLoading(true)
    try {
      console.log("Fetching assigned students for mentor:", mentorId);
      
      // Try both tables to find student assignments
      let assignmentsData = [];
      
      // First try the assigned_students table (new structure)
      const { data: newData, error: newError } = await supabase
        .from("assigned_students")
        .select(`
          id,
          student_id,
          assigned_at
        `)
        .eq("mentor_id", mentorId)
        .order("assigned_at", { ascending: false });
      
      if (!newError && newData && newData.length > 0) {
        console.log(`Found ${newData.length} assigned students in assigned_students table`);
        assignmentsData = [...newData];
      } else {
        console.log("No students found in assigned_students or error occurred:", newError);
      }
      
      // Also try the student_mentor_assignments table (old structure)
      const { data: oldData, error: oldError } = await supabase
        .from("student_mentor_assignments")
        .select(`
          id,
          student_id,
          assigned_at
        `)
        .eq("mentor_id", mentorId)
        .order("assigned_at", { ascending: false });
        
      if (!oldError && oldData && oldData.length > 0) {
        console.log(`Found ${oldData.length} assigned students in student_mentor_assignments table`);
        // Add to our assignments data, avoiding duplicates
        const existingStudentIds = new Set(assignmentsData.map(a => a.student_id));
        const uniqueOldData = oldData.filter(a => !existingStudentIds.has(a.student_id));
        assignmentsData = [...assignmentsData, ...uniqueOldData];
      } else {
        console.log("No students found in student_mentor_assignments or error occurred:", oldError);
      }
      
      console.log(`Total assigned students found: ${assignmentsData.length}`);
      
      if (assignmentsData.length === 0) {
        console.log("No assigned students found for mentor:", mentorId);
        setStudents([]);
        return;
      }
      
      // Get student details in bulk
      const studentIds = assignmentsData.map(a => a.student_id);
      console.log("Student IDs to fetch:", studentIds);
          
      // Get profiles in one query
      const { data: studentsData, error: studentsError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", studentIds);
      
      if (studentsError) {
        console.error("Error fetching student profiles:", studentsError);
      }
      
      console.log(`Found ${studentsData?.length || 0} student profiles`);
      
      // Create lookup maps for faster access
      const studentMap = new Map();
      studentsData?.forEach(student => {
        studentMap.set(student.id, {
          name: student.full_name,
          email: student.email
        });
      });
      
      // Combine data using maps for efficiency
      const enrichedStudents = assignmentsData.map(assignment => {
        const studentInfo = studentMap.get(assignment.student_id) || { name: "Unknown Student", email: "No email available" };
        
        return {
          assignment_id: assignment.id,
          student_id: assignment.student_id,
          student_name: studentInfo.name,
          student_email: studentInfo.email,
          assigned_at: assignment.assigned_at
        };
      });
      
      console.log(`Processed ${enrichedStudents.length} students with details`);
      setStudents(enrichedStudents);
    } catch (error) {
      console.error("Error fetching assigned students:", error);
      // Only show toast for unexpected errors
      toast({
        title: "Error",
        description: "Failed to load your assigned students. Please refresh the page.",
        variant: "destructive"
      });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = searchQuery
    ? students.filter(
        student =>
          student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.student_email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Students</CardTitle>
          <CardDescription>Students assigned to you</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <LoadingSpinner size="lg" animation="border" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>My Students</CardTitle>
            <CardDescription>Students assigned to you for mentoring</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{students.length} Students</span>
          </Badge>
        </div>
        
        {students.length > 0 && (
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {filteredStudents.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {students.length === 0
                ? "You don't have any students assigned to you yet. The admin will assign students to you."
                : "No students match your search criteria."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.assignment_id}>
                    <TableCell className="font-medium">{student.student_name}</TableCell>
                    <TableCell>{student.student_email}</TableCell>
                    <TableCell>{new Date(student.assigned_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Mail className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        <Button variant="outline" size="sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}