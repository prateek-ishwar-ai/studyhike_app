"use client"

import { useState, useEffect } from "react"
import { format, parseISO, isAfter } from "date-fns"
import { Loader2, Calendar, Clock, MessageSquare, ExternalLink, User } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type Meeting = {
  id: string
  student_id: string
  mentor_id: string
  confirmed_day: string
  confirmed_time: string
  topic: string
  meet_link: string
  student: {
    full_name: string
    email: string
  }
  mentor: {
    full_name: string
    email: string
  }
}

// Format time from database (24h) to 12h format
const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export function UpcomingMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchUpcomingMeetings()
    }
  }, [user])

  const fetchUpcomingMeetings = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Get current date in ISO format
      const today = new Date()
      const isoDate = format(today, 'yyyy-MM-dd')
      
      // Query for confirmed meetings where the user is either the student or mentor
      const { data, error } = await supabase
        .from('meeting_requests')
        .select(`
          id,
          student_id,
          mentor_id,
          confirmed_day,
          confirmed_time,
          topic,
          meet_link,
          student:student_id(full_name, email),
          mentor:mentor_id(full_name, email)
        `)
        .eq('status', 'confirmed')
        .gte('confirmed_day', isoDate)
        .or(`student_id.eq.${user.id},mentor_id.eq.${user.id}`)
        .order('confirmed_day', { ascending: true })
        .order('confirmed_time', { ascending: true })
      
      if (error) throw error
      
      setMeetings(data || [])
    } catch (error) {
      console.error('Error fetching upcoming meetings:', error)
      toast({
        title: "Failed to load meetings",
        description: "There was an error loading your upcoming meetings.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading upcoming meetings...</span>
      </div>
    )
  }

  if (meetings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Meetings</CardTitle>
          <CardDescription>You have no upcoming meetings scheduled</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {profile?.role === 'student' 
              ? "Request a meeting with your mentor to get started."
              : "Confirm pending meeting requests to see them here."}
          </p>
        </CardContent>
        {profile?.role === 'student' && (
          <CardFooter>
            <Button asChild>
              <a href="/student/request-meeting">Request Session</a>
            </Button>
          </CardFooter>
        )}
      </Card>
    )
  }

  // Sort meetings by date and time
  const sortedMeetings = [...meetings].sort((a, b) => {
    const dateA = new Date(`${a.confirmed_day}T${a.confirmed_time}`)
    const dateB = new Date(`${b.confirmed_day}T${b.confirmed_time}`)
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Upcoming Meetings</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedMeetings.map((meeting) => {
          const isStudent = meeting.student_id === user?.id
          const otherPerson = isStudent ? meeting.mentor : meeting.student
          const meetingDateTime = new Date(`${meeting.confirmed_day}T${meeting.confirmed_time}`)
          const isToday = format(meetingDateTime, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
          
          return (
            <Card key={meeting.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>
                      {isToday ? 'Today' : format(parseISO(meeting.confirmed_day), 'MMMM d, yyyy')}
                    </CardTitle>
                    <CardDescription>{formatTime(meeting.confirmed_time)}</CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    Confirmed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <User className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {isStudent ? 'Mentor' : 'Student'}: {otherPerson.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{otherPerson.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MessageSquare className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                    <span className="text-sm">{meeting.topic}</span>
                  </div>
                </div>
              </CardContent>
              <Separator />
              <CardFooter className="pt-3">
                <Button 
                  className="w-full" 
                  variant="outline"
                  asChild
                >
                  <a href={meeting.meet_link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Join Meeting
                  </a>
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}