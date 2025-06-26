"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader, AlertCircle, Calendar, Clock, User, MessageSquare, Check, X, Video, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { LoadingSkeleton, CardLoadingSkeleton } from "@/components/ui/loading-skeleton"

export default function MeetingRequestsPage() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    topic: "",
    preferred_time: ""
  })
  const [error, setError] = useState(null)
  const router = useRouter()

  // Fetch meeting requests on component mount
  useEffect(() => {
    fetchMeetingRequests()
  }, [])

  // Function to fetch meeting requests
  const fetchMeetingRequests = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`)
      }
      
      if (!user) {
        throw new Error("You must be logged in to view meeting requests")
      }
      
      // Fetch meeting requests
      const { data, error: fetchError } = await supabase
        .from('meeting_requests')
        .select(`
          id,
          topic,
          preferred_time,
          status,
          created_at,
          mentor_id,
          accepted_by,
          scheduled_time,
          meet_link
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
      
      if (fetchError) {
        throw new Error(`Error fetching meeting requests: ${fetchError.message}`)
      }
      
      // If we have accepted requests, fetch mentor names
      if (data && data.length > 0) {
        const mentorIds = data
          .filter(req => req.mentor_id || req.accepted_by)
          .map(req => req.mentor_id || req.accepted_by)
          .filter(Boolean)
        
        if (mentorIds.length > 0) {
          const { data: mentorData, error: mentorError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', mentorIds)
          
          if (!mentorError && mentorData) {
            // Create a map of mentor IDs to names
            const mentorMap = {}
            mentorData.forEach(mentor => {
              mentorMap[mentor.id] = mentor.full_name
            })
            
            // Add mentor names to the requests
            data.forEach(req => {
              const mentorId = req.mentor_id || req.accepted_by
              if (mentorId && mentorMap[mentorId]) {
                req.mentor_name = mentorMap[mentorId]
              }
            })
          }
        }
      }
      
      setRequests(data || [])
    } catch (err) {
      console.error("Error fetching meeting requests:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Function to handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Function to submit a new meeting request
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      // Validate form data
      if (!formData.topic.trim()) {
        throw new Error("Please enter a topic for the meeting")
      }
      
      if (!formData.preferred_time.trim()) {
        throw new Error("Please enter your preferred time for the meeting")
      }
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`)
      }
      
      if (!user) {
        throw new Error("You must be logged in to create a meeting request")
      }
      
      // Try to find the student's assigned mentor
      let mentorId = null
      
      try {
        // First check assigned_students table
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('assigned_students')
          .select('mentor_id')
          .eq('student_id', user.id)
          .order('assigned_at', { ascending: false })
          .limit(1)
          .single()
        
        if (!assignmentError && assignmentData) {
          mentorId = assignmentData.mentor_id
        } else {
          // Try student_mentor_assignments table as fallback
          const { data: oldAssignmentData, error: oldAssignmentError } = await supabase
            .from('student_mentor_assignments')
            .select('mentor_id')
            .eq('student_id', user.id)
            .order('assigned_at', { ascending: false })
            .limit(1)
            .single()
          
          if (!oldAssignmentError && oldAssignmentData) {
            mentorId = oldAssignmentData.mentor_id
          }
        }
      } catch (error) {
        console.warn("Error finding assigned mentor:", error)
        // Continue without a mentor ID
      }
      
      // Create the meeting request
      const { data, error: insertError } = await supabase
        .from('meeting_requests')
        .insert([
          {
            student_id: user.id,
            mentor_id: mentorId, // Include the mentor ID if found
            topic: formData.topic,
            preferred_time: formData.preferred_time,
            status: 'pending'
          }
        ])
        .select()
      
      if (insertError) {
        throw new Error(`Error creating meeting request: ${insertError.message}`)
      }
      
      // Success!
      toast({
        title: "Success",
        description: "Your meeting request has been submitted",
      })
      
      // Reset form and close dialog
      setFormData({
        topic: "",
        preferred_time: ""
      })
      setIsDialogOpen(false)
      
      // Refresh the list
      fetchMeetingRequests()
    } catch (err) {
      console.error("Error submitting meeting request:", err)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Function to cancel a meeting request
  const handleCancel = async (requestId) => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`)
      }
      
      if (!user) {
        throw new Error("You must be logged in to cancel a meeting request")
      }
      
      // Delete the meeting request
      const { error: deleteError } = await supabase
        .from('meeting_requests')
        .delete()
        .eq('id', requestId)
        .eq('student_id', user.id) // Ensure the student can only delete their own requests
      
      if (deleteError) {
        throw new Error(`Error cancelling meeting request: ${deleteError.message}`)
      }
      
      // Success!
      toast({
        title: "Success",
        description: "Your meeting request has been cancelled",
      })
      
      // Refresh the list
      fetchMeetingRequests()
    } catch (err) {
      console.error("Error cancelling meeting request:", err)
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meeting Requests</h1>
          <p className="text-muted-foreground">Request and manage your meetings with mentors</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request a Meeting</DialogTitle>
              <DialogDescription>
                Fill out the form below to request a meeting with your mentor.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    name="topic"
                    placeholder="What would you like to discuss?"
                    value={formData.topic}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="preferred_time">Preferred Time</Label>
                  <Textarea
                    id="preferred_time"
                    name="preferred_time"
                    placeholder="e.g., Weekdays after 3pm, or specific dates and times"
                    value={formData.preferred_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : loading ? (
        <div className="space-y-6">
          <CardLoadingSkeleton />
          <CardLoadingSkeleton />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Meeting Requests</CardTitle>
            <CardDescription>
              You haven't requested any meetings yet. Click the "New Request" button to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center py-6">
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{request.topic}</CardTitle>
                    <CardDescription>
                      Requested on {new Date(request.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={
                    request.status === 'pending' ? 'outline' :
                    request.status === 'accepted' ? 'success' :
                    'secondary'
                  }>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {request.status === 'pending' ? (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Preferred time: {request.preferred_time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your request is pending. A mentor will respond soon.
                    </p>
                  </div>
                ) : request.status === 'accepted' ? (
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <User className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Mentor: {request.mentor_name || 'Assigned Mentor'}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Scheduled: {request.scheduled_time || 'To be determined'}</span>
                    </div>
                    {request.meet_link && (
                      <div className="flex items-center text-sm">
                        <Video className="mr-2 h-4 w-4 text-muted-foreground" />
                        <a 
                          href={request.meet_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Join Meeting
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This request has been {request.status}.
                  </p>
                )}
              </CardContent>
              {request.status === 'pending' && (
                <CardFooter className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCancel(request.id)}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel Request
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}