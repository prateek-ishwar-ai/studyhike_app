"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  Users, 
  Calendar, 
  MessageSquare, 
  TrendingUp,
  Clock,
  Award,
  Bell,
  Settings,
  LogOut
} from "lucide-react"

export default function MentorAppDashboard() {
  const { profile, signOut } = useAuth()
  const [stats, setStats] = useState({
    totalStudents: 12,
    activeStudents: 8,
    completedSessions: 45,
    upcomingMeetings: 3,
    avgRating: 4.8
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C0E19] via-[#111420] to-[#0C0E19]">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-yellow-500" />
              <div>
                <h1 className="text-xl font-bold text-white">StudyHike Mentor</h1>
                <p className="text-sm text-gray-400">Welcome back, {profile?.full_name || 'Mentor'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                <Settings className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => signOut()}
                className="text-red-400 hover:text-red-300"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Students</p>
                  <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Students</p>
                  <p className="text-2xl font-bold text-white">{stats.activeStudents}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Sessions</p>
                  <p className="text-2xl font-bold text-white">{stats.completedSessions}</p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Upcoming</p>
                  <p className="text-2xl font-bold text-white">{stats.upcomingMeetings}</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Rating</p>
                  <p className="text-2xl font-bold text-white">{stats.avgRating}</p>
                </div>
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-400">
                Common mentor tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                View All Students
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Create Assignment
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Students</CardTitle>
              <CardDescription className="text-gray-400">
                Recently active students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "Rahul Sharma", status: "online", progress: 85 },
                  { name: "Priya Patel", status: "offline", progress: 92 },
                  { name: "Arjun Kumar", status: "online", progress: 78 },
                  { name: "Sneha Singh", status: "offline", progress: 88 }
                ].map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-white">{student.name}</p>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={student.status === 'online' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {student.status}
                        </Badge>
                        <span className="text-xs text-gray-400">{student.progress}% progress</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Upcoming Meetings</CardTitle>
              <CardDescription className="text-gray-400">
                Next scheduled sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { student: "Rahul Sharma", time: "2:00 PM Today", subject: "Physics - Mechanics" },
                  { student: "Priya Patel", time: "4:00 PM Today", subject: "Math - Calculus" },
                  { student: "Arjun Kumar", time: "10:00 AM Tomorrow", subject: "Chemistry - Organic" }
                ].map((meeting, index) => (
                  <div key={index} className="p-3 rounded-lg bg-gray-800/50">
                    <p className="text-sm font-medium text-white">{meeting.student}</p>
                    <p className="text-xs text-yellow-400">{meeting.time}</p>
                    <p className="text-xs text-gray-400">{meeting.subject}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* App-Specific Features Notice */}
        <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-800/50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Mobile App Version</h3>
                <p className="text-gray-300 mb-4">
                  You're using the mobile app version of StudyHike Mentor. This streamlined interface focuses on essential mentoring features optimized for mobile devices.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-yellow-900/50 text-yellow-300">
                    Mobile Optimized
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-900/50 text-blue-300">
                    Offline Ready
                  </Badge>
                  <Badge variant="secondary" className="bg-green-900/50 text-green-300">
                    Biometric Auth
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}