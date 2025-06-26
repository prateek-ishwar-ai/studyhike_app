"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { Calendar as CalendarIcon, Clock, AlertCircle, PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ProgressiveLoadingContainer } from "@/components/ui/progressive-loading"

interface Session {
  id: string
  title: string
  subject: string
  student_name: string
  scheduled_at: string
  duration: number
  status: "scheduled" | "completed" | "cancelled"
}

export default function MentorSessionsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [date, setDate] = useState<Date>(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!user) return
    
    fetchSessions()
  }, [user])
  
  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check if we're in demo mode
      const isDemoMode = window.localStorage.getItem('demo_mentor_mode') === 'true' || !supabase;
      
      if (isDemoMode) {
        console.log("Using demo data for sessions page");
        
        // Get today's date
        const today = new Date();
        
        // Create a few dates for sessions
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        // Create mock sessions
        const mockSessions = [
          {
            id: "sess-1",
            title: "Algebra Review",
            subject: "Mathematics",
            student_name: "Alex Johnson",
            scheduled_at: new Date(today.setHours(10, 0, 0, 0)).toISOString(),
            duration: 60,
            status: "scheduled"
          },
          {
            id: "sess-2",
            title: "Newton's Laws",
            subject: "Physics",
            student_name: "Emma Davis",
            scheduled_at: new Date(today.setHours(13, 30, 0, 0)).toISOString(),
            duration: 60,
            status: "scheduled"
          },
          {
            id: "sess-3",
            title: "Chemical Reactions",
            subject: "Chemistry",
            student_name: "Ryan Smith",
            scheduled_at: new Date(today.setHours(16, 0, 0, 0)).toISOString(),
            duration: 60,
            status: "scheduled"
          },
          {
            id: "sess-4",
            title: "Quadratic Equations",
            subject: "Mathematics",
            student_name: "Alex Johnson",
            scheduled_at: yesterday.toISOString(),
            duration: 60,
            status: "completed"
          },
          {
            id: "sess-5",
            title: "Waves and Optics",
            subject: "Physics",
            student_name: "Emma Davis",
            scheduled_at: yesterday.toISOString(),
            duration: 60,
            status: "cancelled"
          },
          {
            id: "sess-6",
            title: "Geometry Basics",
            subject: "Mathematics",
            student_name: "Alex Johnson",
            scheduled_at: tomorrow.toISOString(),
            duration: 60,
            status: "scheduled"
          },
          {
            id: "sess-7",
            title: "Organic Chemistry",
            subject: "Chemistry",
            student_name: "Ryan Smith",
            scheduled_at: nextWeek.toISOString(),
            duration: 60,
            status: "scheduled"
          }
        ];
        
        setSessions(mockSessions);
        setLoading(false);
        return;
      }
      
      if (!supabase) {
        throw new Error("Supabase client not initialized")
      }
      
      // Helper function to retry Supabase queries
      async function retryQuery(queryFn, maxRetries = 2) {
        let lastError = null;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            if (attempt > 0) {
              console.log(`Retry attempt ${attempt}/${maxRetries}...`);
              // Add a small delay between retries
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
            
            return await queryFn();
          } catch (error) {
            console.error(`Query failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
            lastError = error;
            
            // If this is the last attempt, we'll throw the error
            if (attempt === maxRetries) {
              throw error;
            }
          }
        }
      }
      
      // Get sessions without the join
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, title, subject, scheduled_at, duration, status, student_id')
        .eq('mentor_id', user?.id)
        .order('scheduled_at', { ascending: true });
      
      if (sessionsError) {
        console.error("Error fetching sessions:", 
          JSON.stringify(sessionsError, null, 2),
          sessionsError
        );
        throw sessionsError;
      }
      
      // If we have sessions, get the student profiles separately
      let formattedSessions = [];
      
      if (sessionsData && sessionsData.length > 0) {
        const studentIds = sessionsData.map(session => session.student_id).filter(Boolean);
        
        if (studentIds.length > 0) {
          // Get profiles for these students
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', studentIds);
            
          if (profilesError) {
            console.error("Error fetching student profiles:", 
              JSON.stringify(profilesError, null, 2),
              profilesError
            );
            // Continue with what we have
          }
          
          // Combine the data
          formattedSessions = sessionsData.map(session => {
            const profile = profilesData?.find(p => p.id === session.student_id);
            return {
              id: session.id,
              title: session.title,
              subject: session.subject,
              student_name: profile?.full_name || 'Unknown Student',
              scheduled_at: session.scheduled_at,
              duration: session.duration,
              status: session.status,
            };
          });
        } else {
          // No student IDs, just format the sessions
          formattedSessions = sessionsData.map(session => ({
            id: session.id,
            title: session.title,
            subject: session.subject,
            student_name: 'Unknown Student',
            scheduled_at: session.scheduled_at,
            duration: session.duration,
            status: session.status,
          }));
        }
      }
      
      setSessions(formattedSessions)
    } catch (error) {
      console.error("Error fetching sessions:", 
        JSON.stringify(error, null, 2),
        error
      )
      setError(error instanceof Error ? error.message : "Failed to fetch sessions")
    } finally {
      setLoading(false)
    }
  }
  
  const getTodaySessions = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduled_at)
      sessionDate.setHours(0, 0, 0, 0)
      return sessionDate.getTime() === today.getTime()
    })
  }
  
  const getUpcomingSessions = () => {
    const now = new Date()
    
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduled_at)
      return sessionDate > now && session.status === 'scheduled'
    })
  }
  
  const getPastSessions = () => {
    const now = new Date()
    
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduled_at)
      return sessionDate < now || session.status === 'completed' || session.status === 'cancelled'
    }).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()) // Most recent first
  }
  
  const getSessionsForSelectedDate = () => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduled_at)
      return (
        sessionDate.getDate() === date.getDate() &&
        sessionDate.getMonth() === date.getMonth() &&
        sessionDate.getFullYear() === date.getFullYear()
      )
    })
  }
  
  const formatSessionTime = (dateString: string, duration: number) => {
    const date = new Date(dateString)
    const endTime = new Date(date.getTime() + duration * 60000)
    
    const startStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const endStr = endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    
    return `${startStr} - ${endStr}`
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }
  
  // Get dates that have sessions
  const datesWithSessions = sessions.map(session => {
    const date = new Date(session.scheduled_at)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  })
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-600 mt-2">Manage your tutoring sessions</p>
        </div>
        <Button onClick={() => router.push('/mentor/sessions/create')}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Session
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <AlertCircle className="h-5 w-5 inline mr-2" />
          {error}
        </div>
      )}
      
      {!loading && (
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-4">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" /> Today's Sessions
                </CardTitle>
                <CardDescription>Your scheduled sessions for today</CardDescription>
              </CardHeader>
              <CardContent>
                {getTodaySessions().length > 0 ? (
                  <div className="space-y-4">
                    {getTodaySessions().map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{session.title}</p>
                          <p className="text-sm text-gray-600">
                            {session.subject} with {session.student_name}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatSessionTime(session.scheduled_at, session.duration)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(session.status)}
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/mentor/sessions/${session.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No sessions scheduled for today</p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href="/mentor/sessions/create">Schedule a Session</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>Sessions scheduled for future dates</CardDescription>
              </CardHeader>
              <CardContent>
                {getUpcomingSessions().length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getUpcomingSessions().map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{session.title}</TableCell>
                          <TableCell>{session.student_name}</TableCell>
                          <TableCell>{session.subject}</TableCell>
                          <TableCell>{formatDate(session.scheduled_at)}</TableCell>
                          <TableCell>{formatSessionTime(session.scheduled_at, session.duration)}</TableCell>
                          <TableCell>{getStatusBadge(session.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/mentor/sessions/${session.id}`}>View</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No upcoming sessions scheduled</p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href="/mentor/sessions/create">Schedule a Session</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="past" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Past Sessions</CardTitle>
                <CardDescription>Previously completed or cancelled sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {getPastSessions().length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPastSessions().map((session) => (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{session.title}</TableCell>
                          <TableCell>{session.student_name}</TableCell>
                          <TableCell>{session.subject}</TableCell>
                          <TableCell>{formatDate(session.scheduled_at)}</TableCell>
                          <TableCell>{formatSessionTime(session.scheduled_at, session.duration)}</TableCell>
                          <TableCell>{getStatusBadge(session.status)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/mentor/sessions/${session.id}`}>View</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No past sessions found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="calendar" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-4">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    className="mx-auto"
                    modifiers={{
                      hasSessions: datesWithSessions,
                    }}
                    modifiersStyles={{
                      hasSessions: {
                        backgroundColor: 'rgb(219, 234, 254)',
                        color: 'rgb(29, 78, 216)',
                        fontWeight: 'bold',
                      },
                    }}
                  />
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>
                    Sessions for {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getSessionsForSelectedDate().length > 0 ? (
                    <div className="space-y-4">
                      {getSessionsForSelectedDate().map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{session.title}</p>
                            <p className="text-sm text-gray-600">
                              {session.subject} with {session.student_name}
                            </p>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatSessionTime(session.scheduled_at, session.duration)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(session.status)}
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/mentor/sessions/${session.id}`}>View</Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No sessions scheduled for this date</p>
                      <Button variant="outline" className="mt-4" onClick={() => router.push('/mentor/sessions/create')}>
                        Schedule a Session
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}