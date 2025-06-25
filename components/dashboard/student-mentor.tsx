"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { UserCheck, Mail, Calendar, AlertCircle } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Mentor {
  assignment_id: string
  mentor_id: string
  mentor_name: string
  mentor_email: string
  assigned_at: string
}

export function StudentMentor() {
  const [loading, setLoading] = useState(true)
  const [mentor, setMentor] = useState<Mentor | null>(null)
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
          fetchAssignedMentor(user.id)
        }
      } catch (e) {
        console.error("Error in getCurrentUser:", e)
      } finally {
        setLoading(false)
      }
    }
    
    getCurrentUser()
  }, [])

  const fetchAssignedMentor = async (studentId: string) => {
    setLoading(true)
    try {
      console.log("Fetching assigned mentor for student:", studentId);
      
      // Try both tables to find the mentor assignment
      // First try the assigned_students table (new structure)
      let data, error;
      
      const { data: assignedData, error: assignedError } = await supabase
        .from("assigned_students")
        .select(`
          id,
          mentor_id,
          assigned_at
        `)
        .eq("student_id", studentId)
        .order("assigned_at", { ascending: false })
        .limit(1)
        .single();
      
      // If no data in assigned_students, try the student_mentor_assignments table (old structure)
      if (assignedError && assignedError.code === 'PGRST116') {
        console.log("No mentor found in assigned_students, trying student_mentor_assignments");
        
        const { data: oldData, error: oldError } = await supabase
          .from("student_mentor_assignments")
          .select(`
            id,
            mentor_id,
            assigned_at
          `)
          .eq("student_id", studentId)
          .order("assigned_at", { ascending: false })
          .limit(1)
          .single();
          
        if (!oldError) {
          data = oldData;
          error = null;
        } else {
          error = oldError;
        }
      } else {
        data = assignedData;
        error = assignedError;
      }
      
      console.log("Mentor assignment query result:", { data, error });
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No mentor assigned
          console.log("No mentor assigned to this student")
          setMentor(null)
          return
        }
        console.error("Error fetching mentor assignment:", error)
        setMentor(null)
        return
      }
      
      if (!data) {
        console.log("No mentor assignment data found")
        setMentor(null)
        return
      }
      
      console.log("Found mentor assignment:", data)
      
      // Get mentor details
      const { data: mentorData, error: mentorError } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", data.mentor_id)
        .single()
      
      if (mentorError) {
        console.error("Error fetching mentor profile:", mentorError)
        // Still try to create a mentor object with available data
        setMentor({
          assignment_id: data.id,
          mentor_id: data.mentor_id,
          mentor_name: "Unknown Mentor",
          mentor_email: "No email available",
          assigned_at: data.assigned_at
        })
        return
      }
      
      console.log("Found mentor profile:", mentorData)
      
      // Combine data
      setMentor({
        assignment_id: data.id,
        mentor_id: data.mentor_id,
        mentor_name: mentorData?.full_name || "Unknown Mentor",
        mentor_email: mentorData?.email || "No email available",
        assigned_at: data.assigned_at
      })
    } catch (error) {
      console.error("Error fetching assigned mentor:", error)
      // Only show toast for unexpected errors, not for "no mentor assigned" case
      if (error instanceof Error && !error.message.includes('PGRST116')) {
        toast({
          title: "Error",
          description: "Failed to load your assigned mentor",
          variant: "destructive"
        })
      }
      setMentor(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Mentor</CardTitle>
          <CardDescription>Your assigned mentor</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <LoadingSpinner size="lg" animation="border" />
        </CardContent>
      </Card>
    )
  }

  if (!mentor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Mentor</CardTitle>
          <CardDescription>Your assigned mentor</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Mentor Assigned</AlertTitle>
            <AlertDescription>
              You don't have a mentor assigned yet. The admin will assign a mentor to you soon.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Mentor</CardTitle>
        <CardDescription>Your assigned mentor for guidance and support</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar className="h-24 w-24 border">
            <AvatarFallback className="text-2xl bg-green-100 text-green-700">
              {mentor.mentor_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-xl font-semibold mb-1">{mentor.mentor_name}</h3>
            <p className="text-gray-500 mb-3">{mentor.mentor_email}</p>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button className="flex-1">
                <Mail className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline" className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            </div>
            
            <div className="mt-6 pt-4 border-t text-sm text-gray-500">
              <p className="flex items-center justify-center sm:justify-start">
                <UserCheck className="h-4 w-4 mr-2 text-green-600" />
                Assigned on {new Date(mentor.assigned_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}