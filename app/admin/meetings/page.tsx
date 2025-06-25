"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, Users, UserCheck, AlertCircle, Mail, Filter, Search, ExternalLink } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { format } from "date-fns"

interface Meeting {
  id: string
  student_id: string
  mentor_id: string
  meeting_time: string
  status: 'scheduled' | 'completed' | 'cancelled'
  type: 'auto' | 'on-request'
  join_url?: string
  created_at: string
  student?: {
    full_name: string
    email: string
  }
  mentor?: {
    full_name: string
    email: string
  }
}

interface MeetingRequest {
  id: string
  student_id: string
  mentor_id?: string
  requested_time: string
  subject: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  student?: {
    full_name: string
    email: string
  }
  mentor?: {
    full_name: string
    email: string
  }
}

export default function AdminMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [requests, setRequests] = useState<MeetingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: "all",
    date: "",
    search: "",
  })

  useEffect(() => {
    fetchMeetingsAndRequests()
  }, [])

  const fetchMeetingsAndRequests = async () => {
    try {
      setLoading(true)
      
      if (!supabase) {
        console.error("Supabase client not initialized")
        return
      }

      // Fetch meetings
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select(`
          *,
          student:student_id(id, full_name, email),
          mentor:mentor_id(id, full_name, email)
        `)
        .order('meeting_time', { ascending: true })

      if (meetingsError) {
        console.error("Error fetching meetings:", meetingsError)
        toast({
          title: "Error fetching meetings",
          description: meetingsError.message,
          variant: "destructive",
        })
      } else {
        setMeetings(meetingsData as Meeting[])
      }

      // Fetch meeting requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('meeting_requests')
        .select(`
          *,
          student:student_id(id, full_name, email),
          mentor:mentor_id(id, full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (requestsError) {
        console.error("Error fetching meeting requests:", requestsError)
        toast({
          title: "Error fetching meeting requests",
          description: requestsError.message,
          variant: "destructive",
        })
      } else {
        setRequests(requestsData as MeetingRequest[])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a")
    } catch (e) {
      return "Invalid date"
    }
  }

  const isOngoing = (meeting: Meeting) => {
    const now = new Date()
    const meetingTime = new Date(meeting.meeting_time)
    // Consider a meeting ongoing if it's within 30 minutes of the current time
    const thirtyMinutesInMs = 30 * 60 * 1000
    return Math.abs(now.getTime() - meetingTime.getTime()) < thirtyMinutesInMs && meeting.status === 'scheduled'
  }

  const filteredMeetings = meetings.filter(meeting => {
    // Filter by status
    if (filter.status !== "all" && meeting.status !== filter.status) {
      return false
    }
    
    // Filter by date
    if (filter.date && !meeting.meeting_time.includes(filter.date)) {
      return false
    }
    
    // Filter by search term (student or mentor name)
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase()
      const studentName = meeting.student?.full_name?.toLowerCase() || ""
      const mentorName = meeting.mentor?.full_name?.toLowerCase() || ""
      return studentName.includes(searchTerm) || mentorName.includes(searchTerm)
    }
    
    return true
  })

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Meetings & Requests</h1>
          <p className="text-gray-500">Monitor and manage all meetings and requests</p>
        </div>
        <Button onClick={fetchMeetingsAndRequests}>Refresh Data</Button>
      </div>

      <Tabs defaultValue="meetings">
        <TabsList className="mb-4">
          <TabsTrigger value="meetings">
            <Calendar className="h-4 w-4 mr-2" />
            Meetings
          </TabsTrigger>
          <TabsTrigger value="requests">
            <Clock className="h-4 w-4 mr-2" />
            Requests
          </TabsTrigger>
          <TabsTrigger value="emails">
            <Mail className="h-4 w-4 mr-2" />
            Send Emails
          </TabsTrigger>
        </TabsList>

        {/* Meetings Tab */}
        <TabsContent value="meetings">
          <Card>
            <CardHeader>
              <CardTitle>All Meetings</CardTitle>
              <CardDescription>View and manage all scheduled, completed, and cancelled meetings</CardDescription>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex-1">
                  <Select
                    value={filter.status}
                    onValueChange={(value) => setFilter({ ...filter, status: value })}
                  >
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <Input
                    type="date"
                    placeholder="Filter by date"
                    value={filter.date}
                    onChange={(e) => setFilter({ ...filter, date: e.target.value })}
                  />
                </div>
                
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      className="pl-8"
                      placeholder="Search by name"
                      value={filter.search}
                      onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p>Loading meetings...</p>
                </div>
              ) : filteredMeetings.length === 0 ? (
                <div className="text-center py-10">
                  <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No meetings found</h3>
                  <p className="text-gray-500">Try adjusting your filters or check back later</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredMeetings.map((meeting) => (
                    <Card key={meeting.id} className="overflow-hidden">
                      <div className={`h-2 ${
                        meeting.status === 'scheduled' ? 'bg-blue-500' : 
                        meeting.status === 'completed' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">
                                {meeting.student?.full_name || 'Unknown Student'} with {meeting.mentor?.full_name || 'Unknown Mentor'}
                              </span>
                              {getStatusBadge(meeting.status)}
                              {isOngoing(meeting) && (
                                <Badge className="bg-purple-100 text-purple-800">Ongoing</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span>{formatDateTime(meeting.meeting_time)}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Type: {meeting.type === 'auto' ? 'Auto-scheduled' : 'Requested'}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {isOngoing(meeting) && meeting.join_url && (
                              <Button size="sm" className="gap-1" asChild>
                                <a href={meeting.join_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                  Join as Observer
                                </a>
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Requests</CardTitle>
              <CardDescription>View and manage all pending and processed meeting requests</CardDescription>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <p>Loading requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-10">
                  <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No meeting requests found</h3>
                  <p className="text-gray-500">Students haven't submitted any meeting requests yet</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {requests.map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <div className={`h-2 ${
                        request.status === 'pending' ? 'bg-yellow-500' : 
                        request.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4 text-gray-500" />
                              <span className="font-medium">
                                Request by {request.student?.full_name || 'Unknown Student'}
                                {request.mentor && ` to ${request.mentor.full_name}`}
                              </span>
                              {getStatusBadge(request.status)}
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Clock className="h-4 w-4" />
                              <span>Requested for: {formatDateTime(request.requested_time)}</span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Subject:</span> {request.subject}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {request.status === 'pending' && (
                              <>
                                <Button size="sm" variant="outline" className="gap-1">
                                  Assign Mentor
                                </Button>
                                <Button size="sm" variant="destructive" className="gap-1">
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emails Tab */}
        <TabsContent value="emails">
          <Card>
            <CardHeader>
              <CardTitle>Send Emails</CardTitle>
              <CardDescription>Send bulk or personal emails to students and mentors</CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Recipients</label>
                  <Select defaultValue="all-students">
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-students">All Students</SelectItem>
                      <SelectItem value="all-mentors">All Mentors</SelectItem>
                      <SelectItem value="specific">Specific User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Subject</label>
                  <Input placeholder="Email subject" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea 
                    className="w-full min-h-[200px] p-3 border rounded-md"
                    placeholder="Write your email message here..."
                  ></textarea>
                </div>
                
                <Button className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}