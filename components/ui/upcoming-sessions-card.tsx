"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Video, User } from "lucide-react"
import Link from "next/link"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface Session {
  id: number | string
  title: string
  subject: string
  date: string
  time: string
  mentorName?: string
  studentName?: string
  meetingLink?: string
  status?: "scheduled" | "pending" | "completed" | "cancelled"
}

interface UpcomingSessionsCardProps {
  sessions: Session[]
  loading: boolean
  userType: "student" | "mentor"
  title?: string
  description?: string
  emptyMessage?: string
  limit?: number
  showViewAll?: boolean
}

export function UpcomingSessionsCard({
  sessions = [],
  loading,
  userType,
  title = "Upcoming Sessions",
  description = "Your scheduled sessions",
  emptyMessage = "No upcoming sessions",
  limit = 3,
  showViewAll = true
}: UpcomingSessionsCardProps) {
  // Ensure sessions is always an array even if null or undefined is passed
  const sessionsArray = Array.isArray(sessions) ? sessions : []
  const displaySessions = sessionsArray.slice(0, limit)
  const hasMore = sessionsArray.length > limit
  
  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case "Physics":
        return "bg-blue-100 text-blue-800"
      case "Chemistry":
        return "bg-green-100 text-green-800"
      case "Mathematics":
        return "bg-purple-100 text-purple-800"
      case "Biology":
        return "bg-amber-100 text-amber-800"
      case "English":
        return "bg-pink-100 text-pink-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }
  
  const getStatusBadge = (status?: string) => {
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
      default:
        return null
    }
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
            <Calendar className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner animation="pulse" size="md" text="Loading sessions..." />
          </div>
        ) : displaySessions.length > 0 ? (
          <div className="space-y-4">
            {displaySessions.map((session) => (
              <div 
                key={session.id} 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">{session.title}</h3>
                      <Badge className={getSubjectColor(session.subject)}>{session.subject}</Badge>
                      {getStatusBadge(session.status)}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{session.date}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>{session.time}</span>
                      </div>
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>
                          {userType === "student" 
                            ? `Mentor: ${session.mentorName || (session.status === "pending" ? "To be assigned" : "Assigned Mentor")}` 
                            : `Student: ${session.studentName || "Student"}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  {session.status === "scheduled" && session.meetingLink && (
                    <Button size="sm" variant="outline" className="flex items-center" asChild>
                      <a href={session.meetingLink} target="_blank" rel="noopener noreferrer">
                        <Video className="mr-1 h-3 w-3" />
                        Join
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
              <Link href={userType === "student" ? "/student/sessions" : "/mentor/sessions"}>
                {userType === "student" ? "Book a Session" : "View All Sessions"}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
      {showViewAll && displaySessions.length > 0 && (
        <CardFooter className="flex justify-center border-t pt-4">
          <Button variant="outline" asChild>
            <Link href={userType === "student" ? "/student/sessions" : "/mentor/sessions"}>
              {hasMore ? `View All (${sessionsArray.length})` : "Manage Sessions"}
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}