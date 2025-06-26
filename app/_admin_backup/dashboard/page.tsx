"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Users, UserCheck, BookOpen, Calendar, TrendingUp, AlertCircle, Settings, Database, Shield, Lightbulb } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton"
import { motion } from "framer-motion"
import Link from "next/link"

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalMentors: number
  onlineMentors: number
  homeworkSubmitted: number
  pendingHomework: number
  sessionsToday: number
  totalSessions: number
}

interface RecentActivity {
  id: string
  type: "homework" | "session" | "user" | "mentor"
  message: string
  timestamp: string
  status: "success" | "warning" | "info"
}

interface MentorActivityItem {
  id: string
  name: string
  subject: string
  status: string
  studentsAssigned: number
  homeworkChecking: number
  sessionsToday: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalMentors: 0,
    onlineMentors: 0,
    homeworkSubmitted: 0,
    pendingHomework: 0,
    sessionsToday: 0,
    totalSessions: 0,
  })

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [mentorActivity, setMentorActivity] = useState<MentorActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  
  // Track loading state for each section
  const [sectionLoading, setSectionLoading] = useState({
    stats: true,
    activity: true,
    mentorActivity: true
  })

  // Update the fetchDashboardData function to load in chunks
  useEffect(() => {
    async function fetchDashboardDataInChunks() {
      try {
        if (!supabase) {
          console.error("Supabase client not initialized")
          setLoading(false)
          return
        }

        console.log("Starting admin dashboard data fetch in chunks")

        // First chunk: Fetch basic stats (high priority)
        console.log("Fetching basic stats (first chunk)")
        await fetchBasicStats()
        
        // Second chunk: Fetch recent activity
        console.log("Fetching recent activity (second chunk)")
        await fetchRecentActivity()
        
        // Third chunk: Fetch mentor activity
        console.log("Fetching mentor activity (third chunk)")
        await fetchMentorActivity()
        
        console.log("All admin dashboard data loaded")
      } catch (error) {
        console.error("Error fetching dashboard data in chunks:", error)
        setLoading(false)
      }
    }

    async function fetchBasicStats() {
      try {
        console.log("Starting to fetch basic stats for admin dashboard")
        
        // Fetch total users and active users
        console.log("Fetching profiles data...")
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, role, status')
        
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError)
          throw profilesError
        }

        console.log(`Retrieved ${profiles?.length || 0} profiles`)
        
        const totalUsers = profiles?.length || 0
        const activeUsers = profiles?.filter(profile => profile.status === 'active').length || 0
        const totalMentors = profiles?.filter(profile => profile.role === 'mentor').length || 0
        const onlineMentors = totalMentors

        console.log("Profile stats:", { totalUsers, activeUsers, totalMentors, onlineMentors })

        // Fetch homework data
        console.log("Fetching homework data...")
        const { data: homework, error: homeworkError } = await supabase
          .from('homework')
          .select('id, status')
        
        if (homeworkError) {
          console.error("Error fetching homework:", homeworkError)
          throw homeworkError
        }

        console.log(`Retrieved ${homework?.length || 0} homework items`)
        
        const homeworkSubmitted = homework?.filter(hw => hw.status === 'submitted' || hw.status === 'reviewed').length || 0
        const pendingHomework = homework?.filter(hw => hw.status === 'pending').length || 0
        
        console.log("Homework stats:", { homeworkSubmitted, pendingHomework })

        // Fetch sessions data
        console.log("Fetching sessions data...")
        const { data: allSessions, error: sessionsError } = await supabase
          .from('sessions')
          .select('id, scheduled_at')
        
        if (sessionsError) {
          console.error("Error fetching sessions:", sessionsError)
          throw sessionsError
        }

        console.log(`Retrieved ${allSessions?.length || 0} sessions`)
        
        const totalSessions = allSessions?.length || 0
        
        // Get today's date in YYYY-MM-DD format for comparison
        const today = new Date().toISOString().split('T')[0]
        
        // Filter sessions scheduled for today
        const sessionsToday = allSessions?.filter(session => {
          const sessionDate = new Date(session.scheduled_at).toISOString().split('T')[0]
          return sessionDate === today
        }).length || 0
        
        console.log("Sessions stats:", { totalSessions, sessionsToday })

        // Set dashboard stats
        setStats({
          totalUsers,
          activeUsers,
          totalMentors,
          onlineMentors,
          homeworkSubmitted,
          pendingHomework,
          sessionsToday,
          totalSessions,
        })

        console.log("Basic stats loaded successfully")
        
        // Mark stats as loaded
        setSectionLoading(prev => ({ ...prev, stats: false }))
      } catch (error) {
        console.error("Error fetching basic stats:", error)
        setSectionLoading(prev => ({ ...prev, stats: false }))
      }
    }

    async function fetchRecentActivity() {
      try {
        const recentActivityItems: RecentActivity[] = []
        
        // Fetch 5 most recent homework submissions
        const { data: recentHomework, error: recentHomeworkError } = await supabase
          .from('homework')
          .select('id, title, status, student_id, created_at')
          .order('created_at', { ascending: false })
          .limit(2)
        
        if (recentHomeworkError) {
          console.error("Error fetching recent homework:", recentHomeworkError)
        } else if (recentHomework) {
          // Get student names for the homework
          for (const hw of recentHomework) {
            const { data: studentData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', hw.student_id)
              .single()
            
            const studentName = studentData?.full_name || 'Unknown Student'
            
            recentActivityItems.push({
              id: `hw-${hw.id}`,
              type: 'homework',
              message: `${studentName} ${hw.status === 'submitted' ? 'submitted' : 'is pending on'} ${hw.title}`,
              timestamp: formatTimeAgo(new Date(hw.created_at)),
              status: hw.status === 'submitted' ? 'success' : 'warning',
            })
          }
        }

        // Fetch 2 most recent sessions
        const { data: recentSessions, error: recentSessionsError } = await supabase
          .from('sessions')
          .select('id, title, student_id, mentor_id, status, scheduled_at')
          .order('created_at', { ascending: false })
          .limit(2)
        
        if (recentSessionsError) {
          console.error("Error fetching recent sessions:", recentSessionsError)
        } else if (recentSessions) {
          for (const session of recentSessions) {
            // Get student and mentor names
            const { data: studentData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', session.student_id)
              .single()
            
            const { data: mentorData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', session.mentor_id)
              .single()
            
            const studentName = studentData?.full_name || 'Unknown Student'
            const mentorName = mentorData?.full_name || 'Unknown Mentor'
            
            recentActivityItems.push({
              id: `session-${session.id}`,
              type: 'session',
              message: `Session ${session.status}: ${studentName} with ${mentorName}`,
              timestamp: formatTimeAgo(new Date(session.scheduled_at)),
              status: 'info',
            })
          }
        }

        // Fetch newest user
        const { data: newUser, error: newUserError } = await supabase
          .from('profiles')
          .select('id, full_name, created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (!newUserError && newUser) {
          recentActivityItems.push({
            id: `user-${newUser.id}`,
            type: 'user',
            message: `New user registered: ${newUser.full_name}`,
            timestamp: formatTimeAgo(new Date(newUser.created_at)),
            status: 'success',
          })
        }

        // Set recent activity
        setRecentActivity(recentActivityItems)
        
        // Mark activity as loaded
        setSectionLoading(prev => ({ ...prev, activity: false }))
      } catch (error) {
        console.error("Error fetching recent activity:", error)
        setSectionLoading(prev => ({ ...prev, activity: false }))
      }
    }

    async function fetchMentorActivity() {
      try {
        // Get mentor IDs
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, role')
        
        const mentorIds = profiles
          ?.filter(profile => profile.role === 'mentor')
          .map(mentor => mentor.id) || []
        
        const mentorActivityItems: MentorActivityItem[] = []
        
        // For each mentor, get their data
        for (const mentorId of mentorIds) {
          // Get mentor profile
          const { data: mentorProfile } = await supabase
            .from('profiles')
            .select('full_name, subject_specialization')
            .eq('id', mentorId)
            .single()
          
          if (!mentorProfile) continue
          
          // Get mentor data
          const { data: mentorData } = await supabase
            .from('mentors')
            .select('current_students')
            .eq('id', mentorId)
            .single()
          
          // Count homework assigned to this mentor for checking
          const { data: homeworkChecking } = await supabase
            .from('homework')
            .select('id')
            .eq('mentor_id', mentorId)
            .eq('status', 'submitted')
          
          // Count sessions for today with this mentor
          const { data: mentorSessions } = await supabase
            .from('sessions')
            .select('id, scheduled_at')
            .eq('mentor_id', mentorId)
          
          const today = new Date().toISOString().split('T')[0]
          const mentorSessionsToday = mentorSessions?.filter(session => {
            const sessionDate = new Date(session.scheduled_at).toISOString().split('T')[0]
            return sessionDate === today
          }).length || 0
          
          mentorActivityItems.push({
            id: mentorId,
            name: mentorProfile.full_name,
            subject: mentorProfile.subject_specialization || 'General',
            status: 'online', // Assume all are online for demo
            studentsAssigned: mentorData?.current_students || 0,
            homeworkChecking: homeworkChecking?.length || 0,
            sessionsToday: mentorSessionsToday,
          })
        }
        
        setMentorActivity(mentorActivityItems)
        
        // Mark mentor activity as loaded
        setSectionLoading(prev => ({ ...prev, mentorActivity: false }))
      } catch (error) {
        console.error("Error fetching mentor activity:", error)
        setSectionLoading(prev => ({ ...prev, mentorActivity: false }))
      } finally {
        setLoading(false)
      }
    }

    // Helper function to format timestamps as "X time ago"
    function formatTimeAgo(date: Date): string {
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffSec = Math.round(diffMs / 1000)
      const diffMin = Math.round(diffSec / 60)
      const diffHour = Math.round(diffMin / 60)
      const diffDay = Math.round(diffHour / 24)

      if (diffSec < 60) return `${diffSec} seconds ago`
      if (diffMin < 60) return `${diffMin} minutes ago`
      if (diffHour < 24) return `${diffHour} hours ago`
      return `${diffDay} days ago`
    }

    fetchDashboardDataInChunks()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "homework":
        return <BookOpen className="h-4 w-4" />
      case "session":
        return <Calendar className="h-4 w-4" />
      case "user":
        return <Users className="h-4 w-4" />
      case "mentor":
        return <UserCheck className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-green-400"
      case "warning":
        return "text-yellow-400"
      case "info":
        return "text-blue-400"
      default:
        return "text-gray-400"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0C0E19] via-[#111420] to-[#0C0E19] flex items-center justify-center">
        <div className="text-center">
          <div className="relative h-16 w-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-purple-400/20"></div>
            <div className="absolute inset-0 rounded-full border-t-4 border-purple-400 animate-spin"></div>
          </div>
          <p className="text-gray-400 text-lg">Loading StudyHike admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C0E19] via-[#111420] to-[#0C0E19] text-white">
      <div className="p-6 space-y-8">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-orange-500 p-2 rounded-lg">
              <span role="img" aria-label="bulb" className="text-xl">💡</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">StudyHike Admin Dashboard</h1>
              <p className="text-gray-400 text-lg">Platform Overview & Management</p>
            </div>
          </div>
          <p className="text-gray-300 text-lg">Monitor and manage the entire StudyHike ecosystem</p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="h-auto py-4 w-full bg-yellow-400 hover:bg-yellow-300 text-[#0C0E19] font-bold text-lg" asChild>
              <Link href="/admin/users">
                <Users className="mr-3 h-5 w-5" />
                Manage Users
              </Link>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="h-auto py-4 w-full bg-transparent border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-[#0C0E19] font-bold text-lg" asChild>
              <Link href="/admin/mentors">
                <UserCheck className="mr-3 h-5 w-5" />
                Mentors
              </Link>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="h-auto py-4 w-full bg-transparent border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-[#0C0E19] font-bold text-lg" asChild>
              <Link href="/admin/sessions">
                <Calendar className="mr-3 h-5 w-5" />
                Sessions
              </Link>
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="h-auto py-4 w-full bg-transparent border-2 border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-[#0C0E19] font-bold text-lg" asChild>
              <Link href="/admin/settings">
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/20 hover:border-blue-400/40 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold text-blue-400">Total Users</CardTitle>
                <Users className="h-6 w-6 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                <p className="text-blue-300 text-sm mt-1">{stats.activeUsers} active users</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/20 hover:border-green-400/40 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold text-green-400">Active Mentors</CardTitle>
                <UserCheck className="h-6 w-6 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.totalMentors}</div>
                <p className="text-green-300 text-sm mt-1">{stats.onlineMentors} online now</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-500/20 hover:border-yellow-400/40 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold text-yellow-400">Today's Sessions</CardTitle>
                <Calendar className="h-6 w-6 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.sessionsToday}</div>
                <p className="text-yellow-300 text-sm mt-1">{stats.totalSessions} total sessions</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/20 hover:border-purple-400/40 transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold text-purple-400">Homework Status</CardTitle>
                <BookOpen className="h-6 w-6 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.pendingHomework}</div>
                <p className="text-purple-300 text-sm mt-1">{stats.homeworkSubmitted} completed</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card className="bg-gradient-to-br from-blue-900/50 to-indigo-800/30 border-blue-500/20 hover:border-blue-400/40 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold text-blue-400">
                  <TrendingUp className="mr-3 h-6 w-6" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 bg-blue-900/30 rounded-lg">
                        <div className={`p-2 rounded-full ${getStatusColor(activity.status)} bg-current/20`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{activity.message}</p>
                          <p className="text-xs text-gray-400">{activity.timestamp}</p>
                        </div>
                        <Badge variant={activity.status === 'success' ? 'default' : activity.status === 'warning' ? 'destructive' : 'secondary'}>
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-blue-400 mx-auto mb-3 opacity-50" />
                    <p className="text-gray-400">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Mentor Activity */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <Card className="bg-gradient-to-br from-green-900/50 to-teal-800/30 border-green-500/20 hover:border-green-400/40 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold text-green-400">
                  <UserCheck className="mr-3 h-6 w-6" />
                  Mentor Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mentorActivity.length > 0 ? (
                  <div className="space-y-3">
                    {mentorActivity.slice(0, 4).map((mentor, index) => (
                      <div key={mentor.id} className="flex items-center justify-between p-3 bg-green-900/30 rounded-lg">
                        <div>
                          <p className="font-medium text-white">{mentor.name}</p>
                          <p className="text-sm text-green-300">{mentor.subject}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-white">{mentor.studentsAssigned} students</p>
                          <p className="text-xs text-green-300">{mentor.sessionsToday} sessions today</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserCheck className="h-12 w-12 text-green-400 mx-auto mb-3 opacity-50" />
                    <p className="text-gray-400">No mentor data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Card className="bg-gradient-to-br from-orange-900/50 to-red-800/30 border-orange-500/20 hover:border-orange-400/40 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold text-orange-400">
                  <Shield className="mr-3 h-6 w-6" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Database Status</span>
                    <Badge variant="default" className="bg-green-600">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">API Response Time</span>
                    <span className="text-green-400 font-bold">120ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Active Sessions</span>
                    <span className="text-white font-bold">{stats.sessionsToday}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Server Load</span>
                    <span className="text-yellow-400 font-bold">45%</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">Overall Health</span>
                      <span className="text-sm text-green-300">Excellent</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions & Tips */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <Card className="bg-gradient-to-br from-purple-900/50 to-pink-800/30 border-purple-500/20 hover:border-purple-400/40 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center text-xl font-bold text-purple-400">
                  <Lightbulb className="mr-3 h-6 w-6" />
                  Admin Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white" asChild>
                    <Link href="/admin/database-setup">
                      <Database className="mr-2 h-4 w-4" />
                      Database Setup
                    </Link>
                  </Button>
                  <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white" asChild>
                    <Link href="/admin/assign-students">
                      <Users className="mr-2 h-4 w-4" />
                      Assign Students
                    </Link>
                  </Button>
                  <Button className="w-full bg-green-600 hover:bg-green-500 text-white" asChild>
                    <Link href="/admin/reports">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View Reports
                    </Link>
                  </Button>
                  <div className="mt-4 p-3 bg-purple-900/30 rounded-lg">
                    <h4 className="font-medium text-white mb-2">💡 Admin Tip</h4>
                    <p className="text-sm text-purple-200">Regular monitoring of mentor-student ratios helps maintain quality education delivery.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}