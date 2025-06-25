"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Video, User, MessageSquare } from "lucide-react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface Meeting {
  id: string
  topic: string
  preferred_time: string
  status: "pending" | "accepted" | "rejected"
  created_at: string
  accepted_by?: string
  scheduled_time?: string
  meet_link?: string
  mentor_name?: string
}

interface UpcomingMeetingsCardProps {
  meetings: Meeting[]
  loading: boolean
  title?: string
  description?: string
  emptyMessage?: string
  limit?: number
  showViewAll?: boolean
}

export function UpcomingMeetingsCard({
  meetings = [],
  loading,
  title = "Upcoming Meetings",
  description = "Your scheduled and pending meetings",
  emptyMessage = "No upcoming meetings",
  limit = 3,
  showViewAll = true
}: UpcomingMeetingsCardProps) {
  // Ensure meetings is always an array even if null or undefined is passed
  const meetingsArray = Array.isArray(meetings) ? meetings : []
  const displayMeetings = meetingsArray.slice(0, limit)
  const hasMore = meetingsArray.length > limit
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
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
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not scheduled yet";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  }

  return (
    <Card className="shadow-md border-t-4 border-t-primary">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="bg-primary/10 p-2 rounded-full">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner animation="pulse" size="md" text="Loading meetings..." />
          </div>
        ) : displayMeetings.length > 0 ? (
          <div className="space-y-4">
            {displayMeetings.map((meeting) => (
              <div 
                key={meeting.id} 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">{meeting.topic}</h3>
                      {getStatusBadge(meeting.status)}
                    </div>
                    <div className="space-y-2 text-sm">
                      {meeting.status === "accepted" && meeting.scheduled_time ? (
                        <>
                          <div className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{formatDate(meeting.scheduled_time)}</span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{formatTime(meeting.scheduled_time)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center">
                          <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Preferred time: {meeting.preferred_time}</span>
                        </div>
                      )}
                      {meeting.status === "accepted" && (
                        <div className="flex items-center">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Mentor: {meeting.mentor_name || "Assigned Mentor"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {meeting.status === "accepted" && meeting.meet_link && (
                    <Button size="sm" variant="outline" className="flex items-center" asChild>
                      <a href={meeting.meet_link} target="_blank" rel="noopener noreferrer">
                        <Video className="mr-1 h-3 w-3" />
                        Join Meeting
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{emptyMessage}</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/student/meeting-requests">
                Request a Meeting
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
      {showViewAll && displayMeetings.length > 0 && (
        <CardFooter className="flex justify-center border-t pt-4">
          <Button variant="outline" asChild>
            <Link href="/student/meeting-requests">
              {hasMore ? `View All (${meetingsArray.length})` : "Manage Meetings"}
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}