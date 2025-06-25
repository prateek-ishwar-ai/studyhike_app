"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Loader2, Calendar, Clock, MessageSquare, ExternalLink, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

type MeetingRequest = {
  id: string
  student_id: string
  requested_day: string
  requested_time: string
  topic: string
  status: string
  created_at: string
  student: {
    full_name: string
    email: string
  }
}

// Generate time slots from 9 AM to 8 PM
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 9; hour <= 20; hour++) {
    const hourFormatted = hour % 12 === 0 ? 12 : hour % 12
    const ampm = hour < 12 ? 'AM' : 'PM'
    slots.push(`${hourFormatted}:00 ${ampm}`)
    slots.push(`${hourFormatted}:30 ${ampm}`)
  }
  return slots
}

const timeSlots = generateTimeSlots()

// Format time from database (24h) to 12h format
const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export function PendingMeetingRequests() {
  const [requests, setRequests] = useState<MeetingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<MeetingRequest | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [confirmDate, setConfirmDate] = useState<Date | undefined>(undefined)
  const [confirmTime, setConfirmTime] = useState<string>("")
  const [meetLink, setMeetLink] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchPendingRequests()
  }, [])

  const fetchPendingRequests = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // First, get all students assigned to this mentor
      let assignedStudentIds: string[] = [];
      
      // Try both tables to find student assignments
      // First try the assigned_students table (new structure)
      const { data: newAssignments, error: newError } = await supabase
        .from("assigned_students")
        .select(`student_id`)
        .eq("mentor_id", user.id);
      
      if (!newError && newAssignments && newAssignments.length > 0) {
        console.log(`Found ${newAssignments.length} assigned students in assigned_students table`);
        assignedStudentIds = [...newAssignments.map(a => a.student_id)];
      }
      
      // Also try the student_mentor_assignments table (old structure)
      const { data: oldAssignments, error: oldError } = await supabase
        .from("student_mentor_assignments")
        .select(`student_id`)
        .eq("mentor_id", user.id);
        
      if (!oldError && oldAssignments && oldAssignments.length > 0) {
        console.log(`Found ${oldAssignments.length} assigned students in student_mentor_assignments table`);
        // Add to our assignments data, avoiding duplicates
        const existingStudentIds = new Set(assignedStudentIds);
        const uniqueOldStudentIds = oldAssignments
          .map(a => a.student_id)
          .filter(id => !existingStudentIds.has(id));
        
        assignedStudentIds = [...assignedStudentIds, ...uniqueOldStudentIds];
      }
      
      console.log(`Total assigned students found: ${assignedStudentIds.length}`);
      
      // Now get meeting requests from these students
      let pendingRequests: MeetingRequest[] = [];
      
      if (assignedStudentIds.length > 0) {
        const { data, error } = await supabase
          .from('meeting_requests')
          .select(`
            id,
            student_id,
            requested_day,
            requested_time,
            topic,
            status,
            created_at,
            student:student_id(full_name, email)
          `)
          .in('student_id', assignedStudentIds)
          .eq('status', 'pending')
          .order('requested_day', { ascending: true });
        
        if (error) {
          console.error('Error fetching meeting requests by student IDs:', error);
        } else {
          pendingRequests = data || [];
        }
      }
      
      // Also get requests directly assigned to this mentor
      const { data: directRequests, error: directError } = await supabase
        .from('meeting_requests')
        .select(`
          id,
          student_id,
          requested_day,
          requested_time,
          topic,
          status,
          created_at,
          student:student_id(full_name, email)
        `)
        .eq('mentor_id', user.id)
        .eq('status', 'pending')
        .order('requested_day', { ascending: true });
      
      if (directError) {
        console.error('Error fetching direct meeting requests:', directError);
      } else if (directRequests && directRequests.length > 0) {
        // Combine with student-based requests, avoiding duplicates
        const existingRequestIds = new Set(pendingRequests.map(r => r.id));
        const uniqueDirectRequests = directRequests.filter(r => !existingRequestIds.has(r.id));
        pendingRequests = [...pendingRequests, ...uniqueDirectRequests];
      }
      
      console.log(`Total pending requests found: ${pendingRequests.length}`);
      setRequests(pendingRequests);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      toast({
        title: "Failed to load requests",
        description: "There was an error loading your pending meeting requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleConfirmClick = (request: MeetingRequest) => {
    setSelectedRequest(request)
    setConfirmDate(parseISO(request.requested_day))
    setConfirmTime("")
    setMeetLink("")
    setConfirmDialogOpen(true)
  }

  const handleRejectClick = (request: MeetingRequest) => {
    setSelectedRequest(request)
    setRejectDialogOpen(true)
  }

  const handleConfirmMeeting = async () => {
    if (!selectedRequest || !confirmDate || !confirmTime || !meetLink) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields to confirm the meeting.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      // Convert time string to proper TIME format for PostgreSQL
      const timeString = confirmTime
      const [time, period] = timeString.split(' ')
      const [hours, minutes] = time.split(':')
      let hour = parseInt(hours)
      
      if (period === 'PM' && hour !== 12) {
        hour += 12
      } else if (period === 'AM' && hour === 12) {
        hour = 0
      }
      
      const formattedTime = `${hour.toString().padStart(2, '0')}:${minutes}:00`

      const { error } = await supabase
        .from('meeting_requests')
        .update({
          status: 'confirmed',
          confirmed_day: format(confirmDate, 'yyyy-MM-dd'),
          confirmed_time: formattedTime,
          meet_link: meetLink
        })
        .eq('id', selectedRequest.id)

      if (error) throw error

      toast({
        title: "Meeting confirmed",
        description: "The meeting has been confirmed and scheduled.",
      })

      // Refresh the list
      fetchPendingRequests()
      setConfirmDialogOpen(false)
    } catch (error) {
      console.error('Error confirming meeting:', error)
      toast({
        title: "Failed to confirm meeting",
        description: "There was an error confirming the meeting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRejectMeeting = async () => {
    if (!selectedRequest) return

    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('meeting_requests')
        .update({
          status: 'rejected'
        })
        .eq('id', selectedRequest.id)

      if (error) throw error

      toast({
        title: "Meeting rejected",
        description: "The meeting request has been rejected.",
      })

      // Refresh the list
      fetchPendingRequests()
      setRejectDialogOpen(false)
    } catch (error) {
      console.error('Error rejecting meeting:', error)
      toast({
        title: "Failed to reject meeting",
        description: "There was an error rejecting the meeting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading pending requests...</span>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Incoming Requests</CardTitle>
          <CardDescription>You have no pending meeting requests</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When students request meetings with you, they will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Incoming Requests</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {requests.map((request) => (
          <Card key={request.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{request.student.full_name}</CardTitle>
                  <CardDescription>{request.student.email}</CardDescription>
                </div>
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                  Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="space-y-3">
                <div className="flex items-start">
                  <Calendar className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                  <span className="text-sm">
                    {format(parseISO(request.requested_day), 'MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-start">
                  <Clock className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                  <span className="text-sm">
                    {formatTime(request.requested_time)}
                  </span>
                </div>
                <div className="flex items-start">
                  <MessageSquare className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                  <span className="text-sm line-clamp-2">{request.topic}</span>
                </div>
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="pt-3 flex justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleRejectClick(request)}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleConfirmClick(request)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirm
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Confirm Meeting Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Meeting</DialogTitle>
            <DialogDescription>
              Set the final date, time, and meeting link for this session.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !confirmDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {confirmDate ? format(confirmDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={confirmDate}
                    onSelect={setConfirmDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Time</Label>
              <Select onValueChange={setConfirmTime}>
                <SelectTrigger id="time">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link">Meeting Link</Label>
              <Input
                id="link"
                placeholder="https://meet.google.com/..."
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmMeeting} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Confirm & Schedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Meeting Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Meeting Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this meeting request?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectMeeting} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}