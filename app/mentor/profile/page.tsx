"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { CalendarDays, BookOpen, GraduationCap, Clock, AlertCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Subject {
  id: string
  name: string
  level: string
}

interface Stats {
  totalStudents: number
  totalSessions: number
  totalHomework: number
  completedSessions: number
  activeStudents: number
  avgRating: number
}

export default function MentorProfilePage() {
  const { user, profile } = useAuth()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalSessions: 0,
    totalHomework: 0,
    completedSessions: 0,
    activeStudents: 0,
    avgRating: 0,
  })
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    async function fetchProfileData() {
      try {
        setLoading(true)
        setError(null)

        // Remove any demo mode flags
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('demo_mentor_mode');
        }
        
        // Fetch real subjects data
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('mentor_subjects')
          .select('id, subject_name, level')
          .eq('mentor_id', user.id);
          
        if (subjectsError) {
          console.error("Error fetching subjects:", subjectsError);
        } else {
          // Transform the data to match our interface
          const formattedSubjects = (subjectsData || []).map(subject => ({
            id: subject.id,
            name: subject.subject_name,
            level: subject.level
          }));
          setSubjects(formattedSubjects);
        }
        
        // Fetch real stats data
        
        // Get total students count from both tables
        let totalStudentsCount = 0;
        
        // Count from assigned_students
        const { count: newCount, error: newCountError } = await supabase
          .from('assigned_students')
          .select('student_id', { count: 'exact', head: true })
          .eq('mentor_id', user.id);
          
        // Count from student_mentor_assignments
        const { count: oldCount, error: oldCountError } = await supabase
          .from('student_mentor_assignments')
          .select('student_id', { count: 'exact', head: true })
          .eq('mentor_id', user.id);
          
        totalStudentsCount = (newCount || 0) + (oldCount || 0);
        
        // Get sessions data
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, status')
          .eq('mentor_id', user.id);
          
        const totalSessions = sessionsData?.length || 0;
        const completedSessions = sessionsData?.filter(s => s.status === 'completed').length || 0;
        
        // Get homework data
        const { data: homeworkData, error: homeworkError } = await supabase
          .from('homework')
          .select('id')
          .eq('assigned_by', user.id);
          
        const totalHomework = homeworkData?.length || 0;
        
        // Set real stats
        setStats({
          totalStudents: totalStudentsCount,
          totalSessions: totalSessions,
          totalHomework: totalHomework,
          completedSessions: completedSessions,
          activeStudents: totalStudentsCount, // For now, consider all students active
          avgRating: 0 // We'll implement ratings later
        });
        
        // Fetch real recent sessions
        const { data: recentSessionsData, error: recentSessionsError } = await supabase
          .from('sessions')
          .select(`
            id,
            subject,
            scheduled_at,
            status,
            student:student_id(
              profiles(full_name)
            )
          `)
          .eq('mentor_id', user.id)
          .order('scheduled_at', { ascending: false })
          .limit(5);
          
        if (recentSessionsError) {
          console.error("Error fetching recent sessions:", recentSessionsError);
        } else {
          setRecentSessions(recentSessionsData || []);
        }

      } catch (error) {
        console.error("Error fetching profile data:", error)
        setError("Failed to load profile data")
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [user])

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading profile information...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">View and manage your mentor profile</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <AlertCircle className="h-5 w-5 inline mr-2" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p>Loading profile data from Supabase...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Summary */}
            <Card className="md:col-span-1">
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src="" alt={profile.full_name} />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>{profile.full_name}</CardTitle>
                <CardDescription>{profile.email}</CardDescription>
                <Badge className="mt-2">Mentor</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-sm mb-2">Subjects I Teach</h3>
                    <div className="flex flex-wrap gap-2">
                      {subjects.length > 0 ? (
                        subjects.map(subject => (
                          <Badge key={subject.id} variant="outline" className="bg-blue-50">
                            {subject.name} ({subject.level})
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No subjects added yet</p>
                      )}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full mt-4" asChild>
                    <a href="/mentor/settings">Edit Profile</a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Teaching Statistics</CardTitle>
                <CardDescription>Overview of your teaching activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-blue-600 text-xs font-medium uppercase">Students</p>
                    <p className="text-2xl font-bold">{stats.totalStudents}</p>
                    <p className="text-xs text-gray-500">{stats.activeStudents} active</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-600 text-xs font-medium uppercase">Sessions</p>
                    <p className="text-2xl font-bold">{stats.totalSessions}</p>
                    <p className="text-xs text-gray-500">{stats.completedSessions} completed</p>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-purple-600 text-xs font-medium uppercase">Homework</p>
                    <p className="text-2xl font-bold">{stats.totalHomework}</p>
                    <p className="text-xs text-gray-500">reviews conducted</p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-yellow-600 text-xs font-medium uppercase">Rating</p>
                    <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}/5</p>
                    <p className="text-xs text-gray-500">average student rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>Your most recent teaching sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSessions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSessions.map((session) => {
                      const sessionDate = new Date(session.scheduled_at);
                      const formattedDate = sessionDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      });
                      
                      return (
                        <TableRow key={session.id}>
                          <TableCell>{session.student?.profiles?.full_name || "Unknown Student"}</TableCell>
                          <TableCell>{session.subject}</TableCell>
                          <TableCell>{formattedDate}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                session.status === 'completed' ? 'bg-green-50 text-green-700' :
                                session.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                                'bg-blue-50 text-blue-700'
                              }
                            >
                              {session.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent sessions found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}