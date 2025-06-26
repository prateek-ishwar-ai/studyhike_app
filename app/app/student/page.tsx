"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  User, 
  Calendar, 
  MessageSquare, 
  Trophy,
  Clock,
  Target,
  Bell,
  Settings,
  LogOut
} from "lucide-react"

export default function StudentAppDashboard() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C0E19] via-[#111420] to-[#0C0E19]">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-8 w-8 text-yellow-500" />
              <div>
                <h1 className="text-xl font-bold text-white">StudyHike Student</h1>
                <p className="text-sm text-gray-400">Welcome back, {profile?.full_name || 'Student'}</p>
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
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-800/50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Trophy className="h-12 w-12 text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Keep Learning! 🚀</h2>
                <p className="text-gray-300 mb-4">
                  You're making great progress. Continue your JEE preparation journey with personalized mentoring.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-green-900/50 text-green-300">85% Course Progress</Badge>
                  <Badge className="bg-blue-900/50 text-blue-300">12 Tests Completed</Badge>
                  <Badge className="bg-purple-900/50 text-purple-300">4.2 Rating</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-400">
                What would you like to do today?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                <BookOpen className="mr-2 h-4 w-4" />
                Continue Learning
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Doubt Session
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Target className="mr-2 h-4 w-4" />
                Take Practice Test
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Ask Question
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Today's Schedule</CardTitle>
              <CardDescription className="text-gray-400">
                Your upcoming sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { subject: "Physics - Mechanics", time: "2:00 PM", mentor: "Dr. Sharma", type: "Live Class" },
                  { subject: "Math - Calculus", time: "4:00 PM", mentor: "Prof. Patel", type: "Doubt Session" },
                  { subject: "Chemistry Test", time: "6:00 PM", mentor: "Test Series", type: "Assessment" }
                ].map((session, index) => (
                  <div key={index} className="p-3 rounded-lg bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{session.subject}</p>
                        <p className="text-xs text-gray-400">{session.mentor}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-yellow-400">{session.time}</p>
                        <Badge variant="secondary" className="text-xs">
                          {session.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Physics</h3>
                <Badge className="bg-green-900/50 text-green-300">On Track</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white">78%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Mathematics</h3>
                <Badge className="bg-blue-900/50 text-blue-300">Ahead</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white">92%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Chemistry</h3>
                <Badge className="bg-yellow-900/50 text-yellow-300">Focus Needed</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white">65%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* App Features */}
        <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-800/50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Mobile App Features</h3>
                <p className="text-gray-300 mb-4">
                  Enjoy seamless learning with biometric authentication, offline notes, and instant notifications.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-purple-900/50 text-purple-300">
                    Biometric Login
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-900/50 text-blue-300">
                    Offline Access
                  </Badge>
                  <Badge variant="secondary" className="bg-green-900/50 text-green-300">
                    Push Notifications
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