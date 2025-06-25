"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, User, CheckCircle, Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { RequestMeetingForm } from "@/components/meeting/request-meeting-form"
import { UpcomingMeetings } from "@/components/meeting/upcoming-meetings"
import { MeetingDiagnostic } from "@/components/meeting/meeting-diagnostic"
import { TestMeetingRequest } from "@/components/meeting/test-meeting-request"
import { AuthCheck } from "@/components/meeting/auth-check"

type Mentor = {
  id: string
  full_name: string
  email: string
  subject_specialization?: string
}

export default function RequestMeetingPage() {
  const [loading, setLoading] = useState(true)
  const [mentor, setMentor] = useState<Mentor | null>(null)
  const { user, profile } = useAuth()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    if (user && profile) {
      fetchAssignedMentor()
    }
  }, [user, profile])

  const fetchAssignedMentor = async () => {
    if (!user || !profile) return

    try {
      setLoading(true)
      
      // In a real app, you would have a proper way to get the assigned mentor
      // For now, we'll just get a mentor from the database
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, subject_specialization')
        .eq('role', 'mentor')
        .limit(1)
      
      if (error) throw error
      
      if (data && data.length > 0) {
        setMentor(data[0])
      }
    } catch (error) {
      console.error('Error fetching mentor:', error)
      toast({
        title: "Error",
        description: "Failed to load mentor information. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-12">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please sign in to request a meeting with your mentor.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        <Footer />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-12 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading...</span>
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
            <h1 className="text-3xl font-bold">Meeting Requests</h1>
            <p className="text-muted-foreground">
              Schedule a meeting with your mentor or view your upcoming sessions.
            </p>
          </div>

          <Tabs defaultValue="request">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="request">Request Meeting</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming Meetings</TabsTrigger>
              <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
            </TabsList>
            <TabsContent value="request" className="mt-6">
              {mentor ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Request a Session</CardTitle>
                      <CardDescription>
                        Fill out the form to request a meeting with your mentor.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <RequestMeetingForm mentorId={mentor.id} />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Mentor</CardTitle>
                      <CardDescription>
                        This is your assigned mentor for JEE preparation.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-medium">{mentor.full_name}</h3>
                          <p className="text-sm text-muted-foreground">{mentor.email}</p>
                          {mentor.subject_specialization && (
                            <p className="text-sm text-muted-foreground mt-1">{mentor.subject_specialization} Specialist</p>
                          )}
                        </div>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium mb-2">Meeting Guidelines</h4>
                          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                            <li>Be specific about what you want to discuss</li>
                            <li>Prepare your questions in advance</li>
                            <li>Have your study materials ready</li>
                            <li>Join the meeting on time</li>
                            <li>Follow up on action items after the meeting</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Mentor Assigned</CardTitle>
                    <CardDescription>
                      You don't have a mentor assigned yet. Please contact support.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="upcoming" className="mt-6">
              <UpcomingMeetings />
            </TabsContent>
            <TabsContent value="diagnostic" className="mt-6">
              <div className="grid gap-6">
                <AuthCheck />
                <div className="grid gap-6 lg:grid-cols-2">
                  <MeetingDiagnostic />
                  <TestMeetingRequest />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
}