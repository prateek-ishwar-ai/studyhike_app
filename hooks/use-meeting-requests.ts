"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'

type MeetingRequest = {
  id: string
  student_id: string
  mentor_id: string
  requested_day: string
  requested_time: string
  confirmed_day?: string
  confirmed_time?: string
  topic: string
  status: 'pending' | 'confirmed' | 'rejected'
  meet_link?: string
  created_at: string
  updated_at: string
  student?: {
    full_name: string
    email: string
  }
  mentor?: {
    full_name: string
    email: string
  }
}

export function useMeetingRequests() {
  const [loading, setLoading] = useState(true)
  const [pendingRequests, setPendingRequests] = useState<MeetingRequest[]>([])
  const [upcomingMeetings, setUpcomingMeetings] = useState<MeetingRequest[]>([])
  const { user, profile } = useAuth()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const fetchMeetingRequests = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Get current date in ISO format
      const today = new Date()
      const isoDate = today.toISOString().split('T')[0]
      
      // Fetch pending requests (for mentors only)
      if (profile?.role === 'mentor') {
        const { data: pendingData, error: pendingError } = await supabase
          .from('meeting_requests')
          .select(`
            id,
            student_id,
            mentor_id,
            requested_day,
            requested_time,
            topic,
            status,
            created_at,
            updated_at,
            student:student_id(full_name, email)
          `)
          .eq('mentor_id', user.id)
          .eq('status', 'pending')
          .order('requested_day', { ascending: true })
        
        if (pendingError) {
          console.error('Error fetching pending requests:', pendingError)
        } else {
          setPendingRequests(pendingData || [])
        }
      }
      
      // Fetch upcoming confirmed meetings for both roles
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('meeting_requests')
        .select(`
          id,
          student_id,
          mentor_id,
          confirmed_day,
          confirmed_time,
          topic,
          status,
          meet_link,
          created_at,
          updated_at,
          student:student_id(full_name, email),
          mentor:mentor_id(full_name, email)
        `)
        .eq('status', 'confirmed')
        .gte('confirmed_day', isoDate)
        .or(`student_id.eq.${user.id},mentor_id.eq.${user.id}`)
        .order('confirmed_day', { ascending: true })
        .order('confirmed_time', { ascending: true })
      
      if (upcomingError) {
        console.error('Error fetching upcoming meetings:', upcomingError)
      } else {
        setUpcomingMeetings(upcomingData || [])
      }
    } catch (error) {
      console.error('Error in fetchMeetingRequests:', error)
      toast({
        title: "Error",
        description: "Failed to load meeting data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const confirmMeeting = async (
    meetingId: string, 
    confirmedDay: string, 
    confirmedTime: string, 
    meetLink: string
  ) => {
    if (!user || profile?.role !== 'mentor') {
      toast({
        title: "Permission Denied",
        description: "Only mentors can confirm meetings.",
        variant: "destructive",
      })
      return false
    }

    try {
      const { error } = await supabase
        .from('meeting_requests')
        .update({
          status: 'confirmed',
          confirmed_day: confirmedDay,
          confirmed_time: confirmedTime,
          meet_link: meetLink
        })
        .eq('id', meetingId)
        .eq('mentor_id', user.id)

      if (error) throw error

      // Notify the student (in a real app, this would send an email)
      try {
        await fetch('/api/meetings/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meetingId,
            action: 'confirmed'
          }),
        })
      } catch (notifyError) {
        console.error('Error sending notification:', notifyError)
      }

      toast({
        title: "Meeting Confirmed",
        description: "The meeting has been confirmed and scheduled.",
      })

      // Refresh the meeting lists
      fetchMeetingRequests()
      return true
    } catch (error) {
      console.error('Error confirming meeting:', error)
      toast({
        title: "Error",
        description: "Failed to confirm meeting. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const rejectMeeting = async (meetingId: string) => {
    if (!user || profile?.role !== 'mentor') {
      toast({
        title: "Permission Denied",
        description: "Only mentors can reject meetings.",
        variant: "destructive",
      })
      return false
    }

    try {
      const { error } = await supabase
        .from('meeting_requests')
        .update({
          status: 'rejected'
        })
        .eq('id', meetingId)
        .eq('mentor_id', user.id)

      if (error) throw error

      // Notify the student
      try {
        await fetch('/api/meetings/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meetingId,
            action: 'rejected'
          }),
        })
      } catch (notifyError) {
        console.error('Error sending notification:', notifyError)
      }

      toast({
        title: "Meeting Rejected",
        description: "The meeting request has been rejected.",
      })

      // Refresh the meeting lists
      fetchMeetingRequests()
      return true
    } catch (error) {
      console.error('Error rejecting meeting:', error)
      toast({
        title: "Error",
        description: "Failed to reject meeting. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const requestMeeting = async (
    mentorId: string,
    requestedDay: string,
    requestedTime: string,
    topic: string
  ) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to request a meeting.",
        variant: "destructive",
      })
      return false
    }

    try {
      const { error } = await supabase
        .from('meeting_requests')
        .insert({
          student_id: user.id,
          mentor_id: mentorId,
          requested_day: requestedDay,
          requested_time: requestedTime,
          topic,
          status: 'pending'
        })

      if (error) throw error

      toast({
        title: "Meeting Requested",
        description: "Your meeting request has been sent to the mentor.",
      })

      // Refresh the meeting lists
      fetchMeetingRequests()
      return true
    } catch (error) {
      console.error('Error requesting meeting:', error)
      toast({
        title: "Error",
        description: "Failed to request meeting. Please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  useEffect(() => {
    if (user) {
      fetchMeetingRequests()
    }
  }, [user])

  return {
    loading,
    pendingRequests,
    upcomingMeetings,
    fetchMeetingRequests,
    confirmMeeting,
    rejectMeeting,
    requestMeeting
  }
}