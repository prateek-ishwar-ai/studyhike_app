"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface Student {
  id: string
  full_name: string
  email: string
  current_class?: string
  target_exam?: string
  status: string
  created_at: string
  mentor_id?: string | null
}

interface Mentor {
  id: string
  full_name: string
  email: string
}

interface AssignStudentsDialogProps {
  isOpen: boolean
  onClose: () => void
  mentor: Mentor | null
  onAssignComplete: () => void
}

export function AssignStudentsDialog({
  isOpen,
  onClose,
  mentor,
  onAssignComplete
}: AssignStudentsDialogProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Fetch all students when dialog opens
  useEffect(() => {
    if (isOpen && mentor) {
      fetchStudents()
    }
  }, [isOpen, mentor])

  const fetchStudents = async () => {
    if (!supabase) {
      toast({
        title: "Error",
        description: "Database connection not available",
        variant: "destructive"
      })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log("Fetching students...")

      // First get all students
      const { data: allStudents, error: studentsError } = await supabase
        .from("profiles")
        .select("id, full_name, email, current_class, target_exam, status, created_at")
        .eq("role", "student")
        .order("full_name")

      if (studentsError) {
        console.error("Error fetching students:", studentsError);
        throw new Error(`Failed to load students: ${studentsError.message}`);
      }

      if (!allStudents || allStudents.length === 0) {
        console.log("No students found");
        setStudents([]);
        return;
      }

      let assignmentMap = new Map();
      
      try {
        // Get student-mentor assignments from the assigned_students table
        const { data: assignments, error: assignmentsError } = await supabase
          .from("assigned_students")
          .select("student_id, mentor_id")

        if (assignmentsError) {
          console.warn("Error fetching assignments:", assignmentsError);
          // Continue with students data only
        } else if (assignments) {
          // Create a map of student IDs to their assigned mentor
          assignments.forEach(assignment => {
            assignmentMap.set(assignment.student_id, assignment.mentor_id);
          });
          console.log(`Found ${assignments.length} existing student-mentor assignments`);
        }
      } catch (assignmentError) {
        console.warn("Error processing assignments:", assignmentError);
        // Continue with students data only
      }

      // Combine the data
      const studentsWithAssignments = allStudents.map(student => ({
        ...student,
        mentor_id: assignmentMap.get(student.id) || null
      }));

      console.log(`Found ${studentsWithAssignments.length} students`);
      setStudents(studentsWithAssignments);

      // Pre-select students already assigned to this mentor
      if (mentor) {
        const preSelected = studentsWithAssignments
          .filter(student => student.mentor_id === mentor.id)
          .map(student => student.id);
        
        setSelectedStudents(preSelected);
        console.log(`Pre-selected ${preSelected.length} students already assigned to this mentor`);
      }
    } catch (error) {
      console.error("Error in fetchStudents:", error);
      
      let errorMessage = "Failed to load students. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  const handleAssignStudents = async () => {
    if (!mentor) return

    setSubmitting(true)

    try {
      console.log(`Assigning ${selectedStudents.length} students to mentor ${mentor.id}`)

      // We'll use the assigned_students table that already exists
      console.log("Using assigned_students table for student-mentor assignments");

      // Get current assignments for this mentor
      let currentAssignments = [];
      
      try {
        console.log("Fetching current student assignments...");
        
        // Direct query from assigned_students table
        const { data, error } = await supabase
          .from("assigned_students")
          .select("student_id")
          .eq("mentor_id", mentor.id);

        if (error) {
          console.log("Error fetching current assignments:", error);
          console.log("Proceeding with no assignments");
        } else if (data) {
          currentAssignments = data;
          console.log(`Found ${data.length} existing assignments`);
        }
      } catch (err) {
        console.log("Exception fetching assignments, proceeding with none:", err);
      }

      const currentlyAssigned = currentAssignments?.map(a => a.student_id) || [];
      
      // Students to add (not currently assigned)
      const studentsToAdd = selectedStudents.filter(id => !currentlyAssigned.includes(id));
      
      // Students to remove (currently assigned but not in selection)
      const studentsToRemove = currentlyAssigned.filter(id => !selectedStudents.includes(id));

      console.log(`Adding ${studentsToAdd.length} new assignments, removing ${studentsToRemove.length} assignments`);

      // Add new assignments
      if (studentsToAdd.length > 0) {
        console.log(`Attempting to add ${studentsToAdd.length} student assignments`);
        
        // Process one by one for better error handling
        let successCount = 0;
        
        for (const studentId of studentsToAdd) {
          try {
            console.log(`Adding assignment for student ${studentId}`);
            
            // Get current user ID for assigned_by field
            const { data: userData, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
              console.error("Error getting current user:", userError);
              continue;
            }
            
            const currentUserId = userData?.user?.id;
            
            if (!currentUserId) {
              console.error("No current user ID available");
              continue;
            }
            
            // Direct insert to assigned_students table
            const assignment = {
              student_id: studentId,
              mentor_id: mentor.id,
              assigned_by: currentUserId,
              assigned_at: new Date().toISOString()
            };
            
            const { error } = await supabase
              .from("assigned_students")
              .insert([assignment]);
              
            if (error) {
              console.log(`Could not add assignment for student ${studentId}:`, error);
            } else {
              successCount++;
              console.log(`Successfully added assignment for student ${studentId}`);
            }
          } catch (err) {
            console.log(`Exception adding assignment for student ${studentId}:`, err);
          }
          
          // Small delay between operations to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`Successfully added ${successCount} out of ${studentsToAdd.length} assignments`);
      }

      // Remove assignments
      if (studentsToRemove.length > 0) {
        console.log(`Attempting to remove ${studentsToRemove.length} student assignments`);
        
        // Process one by one for better error handling
        let successCount = 0;
        
        for (const studentId of studentsToRemove) {
          try {
            console.log(`Removing assignment for student ${studentId}`);
            
            // Direct delete from assigned_students table
            const { error } = await supabase
              .from("assigned_students")
              .delete()
              .eq("mentor_id", mentor.id)
              .eq("student_id", studentId);
              
            if (error) {
              console.log(`Could not remove assignment for student ${studentId}:`, error);
            } else {
              successCount++;
              console.log(`Successfully removed assignment for student ${studentId}`);
            }
          } catch (err) {
            console.log(`Exception removing assignment for student ${studentId}:`, err);
          }
          
          // Small delay between operations to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`Successfully removed ${successCount} out of ${studentsToRemove.length} assignments`);
      }

      // Update the mentor's current_students count in the mentors table
      try {
        console.log(`Updating mentor ${mentor.id} student count to ${selectedStudents.length}`);
        
        const { error: updateError } = await supabase
          .from("mentors")
          .update({ current_students: selectedStudents.length })
          .eq("id", mentor.id);

        if (updateError) {
          console.log("Note: Could not update mentor student count, but assignments were processed");
        } else {
          console.log(`Successfully updated mentor student count to ${selectedStudents.length}`);
        }
      } catch (err) {
        console.log("Exception updating mentor student count, but assignments were processed");
      }

      toast({
        title: "Success",
        description: `Successfully assigned students to ${mentor.full_name}`,
      });

      // Delay closing to ensure database operations complete
      setTimeout(() => {
        onAssignComplete();
        onClose();
      }, 500);
    } catch (error) {
      console.error("Error in assignment process:", error);
      
      toast({
        title: "Error",
        description: "There was a problem assigning students. Please try again.",
        variant: "destructive"
      });
    } finally {
      // Set submitting to false after a short delay to ensure the UI shows the loading state
      setTimeout(() => {
        setSubmitting(false);
      }, 500);
    }
  }

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const toggleAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) {
      // If all are selected, deselect all
      setSelectedStudents([])
    } else {
      // Otherwise, select all filtered students
      setSelectedStudents(filteredStudents.map(student => student.id))
    }
  }

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.current_class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.target_exam?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Assign Students to {mentor?.full_name || "Mentor"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students by name, email, class or exam..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" animation="border" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600">No students found in the system</p>
            </div>
          ) : (
            <div>
              <div className="mb-2 flex items-center">
                <Checkbox 
                  id="select-all"
                  checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                  onCheckedChange={toggleAllStudents}
                />
                <Label htmlFor="select-all" className="ml-2">
                  Select All ({filteredStudents.length} students)
                </Label>
                <span className="ml-auto text-sm text-gray-500">
                  {selectedStudents.length} selected
                </span>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Target Exam</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Mentor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const isAssigned = student.mentor_id !== null
                    const isAssignedToCurrentMentor = student.mentor_id === mentor?.id
                    
                    return (
                      <TableRow key={student.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => toggleStudent(student.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{student.full_name}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{student.current_class || "Not specified"}</TableCell>
                        <TableCell>{student.target_exam || "Not specified"}</TableCell>
                        <TableCell>
                          <Badge variant={student.status === "active" ? "default" : "secondary"}>
                            {student.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {isAssigned ? (
                            isAssignedToCurrentMentor ? (
                              <Badge variant="outline" className="bg-green-50">
                                Current Mentor
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                Assigned to another mentor
                              </Badge>
                            )
                          ) : (
                            <Badge variant="outline">Unassigned</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssignStudents} 
            disabled={submitting || loading}
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" animation="spin" className="mr-2" />
                Assigning Students...
              </>
            ) : (
              `Assign ${selectedStudents.length} Students`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}