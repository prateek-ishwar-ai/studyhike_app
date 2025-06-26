"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Video, Plus, User, MessageSquare } from "lucide-react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SessionsSkeleton } from "@/components/ui/sessions-skeleton"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface Session {
  id: number
  title: string
  mentorName: string
  mentorId: string
  scheduledAt: string
  duration: number
  status: "scheduled" | "completed" | "cancelled" | "pending"
  meetingLink?: string
  description?: string
  subject: string
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  
  const [newSession, setNewSession] = useState({
    title: "",
    subject: "Physics",
    date: new Date().toISOString().split("T")[0],
    time: "16:00",
    duration: "60",
    description: "",
  })

  // Track loading state for each section
  const [sectionLoading, setSectionLoading] = useState({
    auth: true,
    sessions: true
  })

  // Fetch sessions from Supabase
  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true)
        setSectionLoading({ auth: true, sessions: true })
        
        console.log("Fetching sessions data")
        
        if (!supabase) {
          console.error("Supabase client not initialized")
          setLoading(false)
          setSectionLoading({ auth: false, sessions: false })
          return
        }

        // Get current user
        console.log("Checking authentication")
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error("Authentication error:", userError)
          router.push('/auth/login')
          return
        }

        console.log("User authenticated:", user.id)
        setUserId(user.id)
        setSectionLoading(prev => ({ ...prev, auth: false }))

        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.log("Session fetch timeout - forcing completion")
          setSectionLoading(prev => ({ ...prev, sessions: false }))
          setLoading(false)
          
          toast({
            title: "Warning",
            description: "Session data is taking longer than expected to load. Some data may be incomplete.",
            variant: "default"
          })
        }, 10000) // 10 second timeout

        // Get sessions
        console.log("Fetching sessions for user:", user.id)
        
        try {
          // First try with the foreign key relationship
          const { data, error } = await supabase
            .from('sessions')
            .select(`
              *,
              mentor:profiles!sessions_mentor_id_fkey(full_name)
            `)
            .eq('student_id', user.id)
            .order('scheduled_at', { ascending: true })
          
          // Clear the timeout since we got a response
          clearTimeout(timeoutId)
          
          if (error) {
            console.error("Error with foreign key query, trying simpler query:", error)
            
            // If the foreign key query fails, try a simpler query
            const { data: simpleData, error: simpleError } = await supabase
              .from('sessions')
              .select('*')
              .eq('student_id', user.id)
              .order('scheduled_at', { ascending: true })
            
            if (simpleError) {
              console.error("Error with simple query too:", simpleError)
              throw simpleError
            }
            
            if (simpleData) {
              console.log(`Retrieved ${simpleData.length} sessions with simple query`)
              
              const formattedSessions = simpleData.map(session => ({
                id: session.id,
                title: session.title,
                mentorName: session.status === "pending" ? "To be assigned" : "Assigned Mentor",
                mentorId: session.mentor_id,
                scheduledAt: session.scheduled_at,
                duration: session.duration,
                status: session.status,
                meetingLink: session.meeting_link || undefined,
                description: session.description || undefined,
                subject: session.subject
              }))
              
              console.log("Sessions formatted successfully from simple query")
              setSessions(formattedSessions)
            } else {
              setSessions([])
            }
          } else if (data) {
            console.log(`Retrieved ${data.length} sessions with foreign key query`)
            
            const formattedSessions = data.map(session => ({
              id: session.id,
              title: session.title,
              mentorName: session.mentor?.full_name || (session.status === "pending" ? "To be assigned" : "Assigned Mentor"),
              mentorId: session.mentor_id,
              scheduledAt: session.scheduled_at,
              duration: session.duration,
              status: session.status,
              meetingLink: session.meeting_link || undefined,
              description: session.description || undefined,
              subject: session.subject
            }))
            
            console.log("Sessions formatted successfully")
            setSessions(formattedSessions)
          } else {
            // Handle case where data is null but no error
            console.log("No session data returned")
            setSessions([])
          }
        } catch (queryError) {
          console.error("Error in session queries:", queryError)
          toast({
            title: "Error",
            description: "Failed to load your sessions. Please try again later.",
            variant: "destructive"
          })
          // Still set sessions to empty array to avoid stuck UI
          setSessions([])
        }
      } catch (error) {
        console.error("Error in fetch sessions:", error)
        // Set sessions to empty array to avoid stuck UI
        setSessions([])
        
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading sessions.",
          variant: "destructive"
        })
      } finally {
        setSectionLoading(prev => ({ ...prev, sessions: false }))
        setLoading(false)
      }
    }

    fetchSessions()
  }, [router, supabase])

  const handleBookSession = async () => {
    if (!newSession.title || !newSession.date || !newSession.time || !userId || !supabase) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const scheduledAt = `${newSession.date}T${newSession.time}:00`
    const now = new Date()
    const sessionDate = new Date(scheduledAt)
    
    // Validate if the date is in the future
    if (sessionDate <= now) {
      toast({
        title: "Invalid date or time",
        description: "Session must be scheduled for a future date and time",
        variant: "destructive"
      })
      return
    }

    setSubmitLoading(true)
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log("Session booking timeout - forcing completion")
      setSubmitLoading(false)
      
      toast({
        title: "Request may be processing",
        description: "Your request is taking longer than expected. Please check your sessions list in a few moments to see if it was successful.",
        variant: "default"
      })
    }, 8000) // 8 second timeout

    try {
      console.log("Submitting session request with data:", {
        student_id: userId,
        title: newSession.title,
        subject: newSession.subject,
        scheduled_at: scheduledAt,
        duration_minutes: parseInt(newSession.duration)
      })
      
      // Insert into database - use a placeholder mentor_id for pending sessions
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          student_id: userId,
          mentor_id: '00000000-0000-0000-0000-000000000000', // Placeholder mentor ID for pending sessions
          title: newSession.title,
          subject: newSession.subject,
          scheduled_at: scheduledAt,
          duration: parseInt(newSession.duration), // Fixed field name from duration_minutes to duration
          description: newSession.description || "",
          status: "pending"
        })
        .select('id')
        .single()

      // Clear the timeout since we got a response
      clearTimeout(timeoutId)

      if (error) {
        console.error("Database error when booking session:", error)
        throw error
      }

      console.log("Session created successfully with ID:", data.id)

      // Add to local state
      const session: Session = {
        id: data.id,
        title: newSession.title,
        mentorName: "To be assigned",
        mentorId: "00000000-0000-0000-0000-000000000000", // Use the same placeholder ID
        scheduledAt,
        duration: parseInt(newSession.duration),
        status: "pending",
        description: newSession.description || "",
        subject: newSession.subject,
      }

      setSessions((prev) => [session, ...prev])

      // Reset form
      setNewSession({
        title: "",
        subject: "Physics",
        date: new Date().toISOString().split("T")[0],
        time: "16:00",
        duration: "60",
        description: "",
      })

      toast({
        title: "Session request sent",
        description: "Your session request has been submitted. A mentor will be assigned shortly.",
      })
    } catch (error: any) {
      // Clear the timeout if there was an error
      clearTimeout(timeoutId)
      
      console.error("Error booking session:", error)
      
      // Provide more specific error messages
      let errorMessage = "Failed to book session. Please try again."
      
      if (error?.message) {
        if (error.message.includes("foreign key constraint")) {
          errorMessage = "There was an issue with your student account. Please contact support."
        } else if (error.message.includes("duplicate key")) {
          errorMessage = "You already have a similar session request. Please check your existing sessions."
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your internet connection and try again."
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      try {
        clearTimeout(timeoutId)
      } catch (e) {
        // Ignore errors when clearing timeout
      }
      setSubmitLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Confirmed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Completed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelled
          </Badge>
        )
      default:
        return null
    }
  }

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case "Physics":
        return "bg-blue-100 text-blue-800"
      case "Chemistry":
        return "bg-green-100 text-green-800"
      case "Mathematics":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Filter sessions by status
  const upcomingSessions = sessions.filter(
    (session) => session.status === "scheduled" || session.status === "pending"
  )
  const pastSessions = sessions.filter(
    (session) => session.status === "completed" || session.status === "cancelled"
  )
  
  if (loading && !sectionLoading.auth && sectionLoading.sessions) {
    return <SessionsSkeleton />
  }

  return (
    <div className="staggered-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-600 mt-1">Book and manage your mentor sessions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/student/meeting-requests">
              <MessageSquare className="mr-2 h-4 w-4" />
              Request Meeting
            </Link>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button aria-label="Book Session">
                <Plus className="mr-2 h-4 w-4" />
                Book Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Book a New Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Session Title</Label>
                    <Input
                      id="title"
                      value={newSession.title}
                      onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                      placeholder="e.g., Physics Doubt Clearing"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Select
                      value={newSession.subject}
                      onValueChange={(value) => setNewSession({ ...newSession, subject: value })}
                    >
                      <SelectTrigger id="subject">
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Physics">Physics</SelectItem>
                        <SelectItem value="Chemistry">Chemistry</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newSession.date}
                      onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newSession.time}
                      onChange={(e) => setNewSession({ ...newSession, time: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select
                    value={newSession.duration}
                    onValueChange={(value) => setNewSession({ ...newSession, duration: value })}
                  >
                    <SelectTrigger id="duration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                      <SelectItem value="120">120 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newSession.description}
                    onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                    placeholder="Describe what you'd like to discuss..."
                    rows={3}
                  />
                </div>

                <Button className="w-full" onClick={handleBookSession} disabled={submitLoading}>
                  {submitLoading ? (
                    <>
                      <LoadingSpinner size="sm" animation="spin" />
                      <span className="ml-2">Booking...</span>
                    </>
                  ) : (
                    "Book Session"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming ({upcomingSessions.length})</TabsTrigger>
          <TabsTrigger value="past">Past Sessions ({pastSessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>Your scheduled and pending sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-lg">{session.title}</h3>
                            <Badge className={getSubjectColor(session.subject)}>
                              {session.subject}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm">
                            <span className="font-medium">Mentor:</span>{" "}
                            {session.mentorName}
                          </p>
                          <p className="text-gray-600 text-sm">
                            <span className="font-medium">When:</span>{" "}
                            {formatDateTime(session.scheduledAt)}
                          </p>
                          <p className="text-gray-600 text-sm">
                            <span className="font-medium">Duration:</span>{" "}
                            {session.duration} minutes
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          {session.status === "scheduled" && session.meetingLink && (
                            <Button size="sm" variant="outline" asChild>
                              <a
                                href={session.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Video className="mr-2 h-4 w-4" />
                                Join Meeting
                              </a>
                            </Button>
                          )}
                          {session.status === "pending" && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                              Awaiting Confirmation
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming sessions</p>
                  <p className="text-sm text-gray-500 mt-1 mb-4">You have two options to connect with mentors:</p>
                  
                  <div className="flex flex-col md:flex-row gap-4 justify-center mt-2">
                    <div className="border rounded-lg p-4 max-w-xs mx-auto md:mx-0">
                      <h3 className="font-medium mb-2">Book a Session</h3>
                      <p className="text-sm text-gray-500 mb-3">Schedule a session directly with available time slots</p>
                      <Button size="sm" onClick={() => document.querySelector('[aria-label="Book Session"]')?.click()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Book Session
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4 max-w-xs mx-auto md:mx-0">
                      <h3 className="font-medium mb-2">Request a Meeting</h3>
                      <p className="text-sm text-gray-500 mb-3">Request a meeting with flexible timing options</p>
                      <Button size="sm" variant="outline" asChild>
                        <Link href="/student/meeting-requests">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          Request Meeting
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past">
          <Card>
            <CardHeader>
              <CardTitle>Past Sessions</CardTitle>
              <CardDescription>Your completed and cancelled sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {pastSessions.length > 0 ? (
                <div className="space-y-4">
                  {pastSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-lg">{session.title}</h3>
                            <Badge className={getSubjectColor(session.subject)}>
                              {session.subject}
                            </Badge>
                            {getStatusBadge(session.status)}
                          </div>
                          <p className="text-gray-600 text-sm">
                            <span className="font-medium">Mentor:</span>{" "}
                            {session.mentorName}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>
                          {formatDateTime(session.scheduledAt)} • {session.duration} minutes
                        </p>
                      </div>
                      {session.description && <p className="text-gray-600 text-sm mt-2">{session.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-600">No past sessions yet</p>
                  <p className="text-sm text-gray-500 mt-1">Your completed sessions will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}