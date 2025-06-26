"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { supabase } from "@/lib/supabase/client"

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
}

export default function DirectAssignStudents() {
  const [students, setStudents] = useState<Profile[]>([])
  const [mentors, setMentors] = useState<Profile[]>([])
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedMentor, setSelectedMentor] = useState("")
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [assignments, setAssignments] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("role", "student")

      if (studentsError) {
        console.error("Error fetching students:", studentsError)
        toast({
          title: "Error",
          description: "Failed to load students",
          variant: "destructive"
        })
      } else {
        setStudents(studentsData || [])
      }

      // Fetch mentors
      const { data: mentorsData, error: mentorsError } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("role", "mentor")

      if (mentorsError) {
        console.error("Error fetching mentors:", mentorsError)
        toast({
          title: "Error",
          description: "Failed to load mentors",
          variant: "destructive"
        })
      } else {
        setMentors(mentorsData || [])
      }

      // We'll use the assigned_students table that already exists
      console.log("Using assigned_students table for student-mentor assignments")

      // Fetch existing assignments from assigned_students table
      try {
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from("assigned_students")
          .select("id, student_id, mentor_id, assigned_at")

        if (!assignmentsError && assignmentsData) {
          setAssignments(assignmentsData)
        } else {
          console.log("No assignments found or error:", assignmentsError)
          setAssignments([])
        }
      } catch (error) {
        console.log("Error fetching assignments:", error)
        setAssignments([])
      }
    } catch (error) {
      console.error("Error in fetchData:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedStudent || !selectedMentor) {
      toast({
        title: "Error",
        description: "Please select both a student and a mentor",
        variant: "destructive"
      })
      return
    }

    // Check if assignment already exists
    const existingAssignment = assignments.find(
      a => a.student_id === selectedStudent && a.mentor_id === selectedMentor
    )

    if (existingAssignment) {
      toast({
        title: "Error",
        description: "This student is already assigned to this mentor",
        variant: "destructive"
      })
      return
    }

    setAssigning(true)
    try {
      // Get current user ID for assigned_by field
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        throw new Error("Could not get current user")
      }
      
      const currentUserId = userData?.user?.id
      
      if (!currentUserId) {
        throw new Error("No current user ID available")
      }
      
      // Insert directly into assigned_students table
      const { data: insertData, error: insertError } = await supabase
        .from("assigned_students")
        .insert([{
          student_id: selectedStudent,
          mentor_id: selectedMentor,
          assigned_by: currentUserId
        }])
        .select()
      
      if (insertError) {
        throw insertError
      }
      
      // Get the student and mentor details for the notification
      const student = students.find(s => s.id === selectedStudent)
      const mentor = mentors.find(m => m.id === selectedMentor)
      
      // Send email notifications
      if (student && mentor) {
        try {
          // Call our notification API
          const response = await fetch('/api/assignments/notify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              studentId: student.id,
              mentorId: mentor.id
            }),
          })
          
          const result = await response.json()
          
          if (!result.success) {
            console.warn('Email notification failed:', result.error)
          } else {
            console.log('Email notifications sent successfully')
          }
        } catch (notifyError) {
          console.error('Error sending email notifications:', notifyError)
          // Continue anyway as the assignment was successful
        }
      }
      
      toast({
        title: "Success",
        description: "Student assigned to mentor successfully"
      })

      // Reset selection
      setSelectedStudent("")
      setSelectedMentor("")

      // Refresh data
      fetchData()
    } catch (error) {
      console.error("Error in handleAssign:", error)
      
      // Try alternative approach with more detailed error handling
      try {
        console.log("Trying alternative approach for assignment")
        
        // Get current user ID again as a fallback
        const { data: userData, error: userError } = await supabase.auth.getUser()
        const currentUserId = userData?.user?.id || "00000000-0000-0000-0000-000000000000" // Fallback ID
        
        const { error: insertError } = await supabase
          .from("assigned_students")
          .insert([
            {
              student_id: selectedStudent,
              mentor_id: selectedMentor,
              assigned_by: currentUserId
            }
          ])
        
        if (insertError) {
          console.error("Alternative approach error:", insertError)
          throw insertError
        }
        
        toast({
          title: "Success",
          description: "Student assigned to mentor successfully"
        })

        // Reset selection
        setSelectedStudent("")
        setSelectedMentor("")

        // Refresh data
        fetchData()
      } catch (insertError) {
        console.error("Error in alternative approach:", insertError)
        toast({
          title: "Error",
          description: "Failed to assign student to mentor. Please try again.",
          variant: "destructive"
        })
      }
    } finally {
      setAssigning(false)
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Direct Student Assignment</CardTitle>
        <CardDescription>
          Assign students to mentors directly using SQL
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select Student
                </label>
                <Select
                  value={selectedStudent}
                  onValueChange={setSelectedStudent}
                >
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select Mentor
                </label>
                <Select
                  value={selectedMentor}
                  onValueChange={setSelectedMentor}
                >
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
              disabled={assigning || !selectedStudent || !selectedMentor}
              className="w-full"
            >
              {assigning ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Assigning...
                </>
              ) : (
                "Assign Student to Mentor"
              )}
            </Button>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Current Assignments ({assignments.length})</h3>
              {assignments.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {assignments.map(assignment => {
                    const student = students.find(s => s.id === assignment.student_id)
                    const mentor = mentors.find(m => m.id === assignment.mentor_id)
                    return (
                      <li key={assignment.id} className="p-2 bg-gray-50 rounded">
                        <strong>{student?.full_name || 'Unknown Student'}</strong> assigned to <strong>{mentor?.full_name || 'Unknown Mentor'}</strong>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No assignments yet</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}