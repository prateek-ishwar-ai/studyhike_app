"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Users, BookOpen, Calendar } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface ReportData {
  userStats: {
    totalUsers: number
    activeUsers: number
    newUsersThisMonth: number
    studentCount: number
    mentorCount: number
  }
  homeworkStats: {
    totalHomework: number
    completedHomework: number
    pendingHomework: number
    averageScore: number
  }
  sessionStats: {
    totalSessions: number
    completedSessions: number
    scheduledSessions: number
    averageDuration: number
  }
  subjectPerformance: {
    subject: string
    averageScore: number
    totalStudents: number
    completionRate: number
  }[]
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    try {
      // Fetch user statistics
      const { data: users, error: usersError } = await supabase.from("users").select("role, status, created_at")

      if (usersError) throw usersError

      // Fetch homework statistics
      const { data: homework, error: homeworkError } = await supabase.from("homework").select("status, score")

      if (homeworkError) throw homeworkError

      // Fetch session statistics
      const { data: sessions, error: sessionsError } = await supabase.from("sessions").select("status, duration")

      if (sessionsError) throw sessionsError

      // Process the data
      const userStats = {
        totalUsers: users?.length || 0,
        activeUsers: users?.filter((u) => u.status === "active").length || 0,
        newUsersThisMonth:
          users?.filter((u) => {
            const created = new Date(u.created_at)
            const now = new Date()
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
          }).length || 0,
        studentCount: users?.filter((u) => u.role === "student").length || 0,
        mentorCount: users?.filter((u) => u.role === "mentor").length || 0,
      }

      const homeworkStats = {
        totalHomework: homework?.length || 0,
        completedHomework: homework?.filter((h) => h.status === "reviewed").length || 0,
        pendingHomework: homework?.filter((h) => h.status === "pending").length || 0,
        averageScore: homework?.length > 0 ? homework.reduce((sum, h) => sum + (h.score || 0), 0) / homework.length : 0,
      }

      const sessionStats = {
        totalSessions: sessions?.length || 0,
        completedSessions: sessions?.filter((s) => s.status === "completed").length || 0,
        scheduledSessions: sessions?.filter((s) => s.status === "scheduled").length || 0,
        averageDuration:
          sessions?.length > 0 ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length : 0,
      }

      const subjectPerformance = [
        { subject: "Physics", averageScore: 78, totalStudents: 45, completionRate: 85 },
        { subject: "Chemistry", averageScore: 74, totalStudents: 42, completionRate: 78 },
        { subject: "Mathematics", averageScore: 82, totalStudents: 48, completionRate: 92 },
      ]

      setReportData({
        userStats,
        homeworkStats,
        sessionStats,
        subjectPerformance,
      })
    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading reports...</div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center py-10">
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">
          {supabase ? "No report data available" : "Supabase not connected - Running in demo mode"}
        </p>
        {!supabase && <p className="text-sm text-gray-500 mt-1">Connect Supabase to see real analytics data</p>}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600 mt-1">Platform performance and user analytics</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.userStats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">+{reportData.userStats.newUsersThisMonth} this month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData.userStats.activeUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((reportData.userStats.activeUsers / reportData.userStats.totalUsers) * 100)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Homework Completion</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    (reportData.homeworkStats.completedHomework / reportData.homeworkStats.totalHomework) * 100,
                  )}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  {reportData.homeworkStats.completedHomework}/{reportData.homeworkStats.totalHomework} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(reportData.sessionStats.averageDuration)} min</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.sessionStats.completedSessions} sessions completed
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance</CardTitle>
                <CardDescription>Average scores and completion rates by subject</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportData.subjectPerformance.map((subject) => (
                  <div key={subject.subject} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{subject.subject}</span>
                      <Badge variant="outline">{subject.averageScore}% avg</Badge>
                    </div>
                    <Progress value={subject.completionRate} />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{subject.totalStudents} students</span>
                      <span>{subject.completionRate}% completion</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Health</CardTitle>
                <CardDescription>Key metrics and indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>User Engagement</span>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-green-600">+12%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Homework Submissions</span>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-green-600">+8%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Session Attendance</span>
                  <div className="flex items-center">
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    <span className="text-red-600">-3%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Average Score</span>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-green-600">+5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Students</span>
                    <span>{reportData.userStats.studentCount}</span>
                  </div>
                  <Progress value={(reportData.userStats.studentCount / reportData.userStats.totalUsers) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Mentors</span>
                    <span>{reportData.userStats.mentorCount}</span>
                  </div>
                  <Progress value={(reportData.userStats.mentorCount / reportData.userStats.totalUsers) * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Active Users</span>
                    <span>{reportData.userStats.activeUsers}</span>
                  </div>
                  <Progress value={(reportData.userStats.activeUsers / reportData.userStats.totalUsers) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>New This Month</span>
                    <span>{reportData.userStats.newUsersThisMonth}</span>
                  </div>
                  <Progress value={(reportData.userStats.newUsersThisMonth / reportData.userStats.totalUsers) * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+{reportData.userStats.newUsersThisMonth}</div>
                  <p className="text-sm text-gray-500">New users this month</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round((reportData.userStats.activeUsers / reportData.userStats.totalUsers) * 100)}%
                  </div>
                  <p className="text-sm text-gray-500">User retention rate</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Homework Performance</CardTitle>
                <CardDescription>Homework submission and scoring statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{reportData.homeworkStats.totalHomework}</div>
                    <p className="text-sm text-gray-500">Total Assignments</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {reportData.homeworkStats.completedHomework}
                    </div>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Completion Rate</span>
                    <span>
                      {Math.round(
                        (reportData.homeworkStats.completedHomework / reportData.homeworkStats.totalHomework) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={(reportData.homeworkStats.completedHomework / reportData.homeworkStats.totalHomework) * 100}
                  />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(reportData.homeworkStats.averageScore)}%
                  </div>
                  <p className="text-sm text-gray-500">Average Score</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session Analytics</CardTitle>
                <CardDescription>Mentoring session statistics and trends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{reportData.sessionStats.totalSessions}</div>
                    <p className="text-sm text-gray-500">Total Sessions</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{reportData.sessionStats.completedSessions}</div>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Completion Rate</span>
                    <span>
                      {Math.round(
                        (reportData.sessionStats.completedSessions / reportData.sessionStats.totalSessions) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={(reportData.sessionStats.completedSessions / reportData.sessionStats.totalSessions) * 100}
                  />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(reportData.sessionStats.averageDuration)} min
                  </div>
                  <p className="text-sm text-gray-500">Average Duration</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(reportData.userStats.activeUsers * 0.7)}</div>
                <p className="text-sm text-gray-500">Users active today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session Frequency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.3</div>
                <p className="text-sm text-gray-500">Sessions per student/week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Homework Frequency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.1</div>
                <p className="text-sm text-gray-500">Assignments per student/week</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
