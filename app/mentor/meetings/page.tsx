"use client"

import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { PendingMeetingRequests } from "@/components/meeting/pending-meeting-requests"
import { UpcomingMeetings } from "@/components/meeting/upcoming-meetings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function MentorMeetingsPage() {
  const { user, profile } = useAuth()
  
  if (!user || profile?.role !== 'mentor') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-12">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You must be logged in as a mentor to access this page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-12">
        <div className="grid gap-8">
          <div>
            <h1 className="text-3xl font-bold">Mentor Dashboard</h1>
            <p className="text-muted-foreground">
              Manage meeting requests and view your upcoming sessions.
            </p>
          </div>

          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">Pending Requests</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming Meetings</TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-6">
              <PendingMeetingRequests />
            </TabsContent>
            <TabsContent value="upcoming" className="mt-6">
              <UpcomingMeetings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  )
}