"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  Settings, 
  Shield,
  TrendingUp,
  AlertTriangle,
  Bell,
  LogOut
} from "lucide-react"

export default function AdminAppDashboard() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C0E19] via-[#111420] to-[#0C0E19]">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-red-500" />
              <div>
                <h1 className="text-xl font-bold text-white">StudyHike Admin</h1>
                <p className="text-sm text-gray-400">Welcome back, {profile?.full_name || 'Admin'}</p>
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
        {/* System Status */}
        <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-800/50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Shield className="h-12 w-12 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">System Status: All Good ✅</h2>
                <p className="text-gray-300 mb-4">
                  Platform is running smoothly. All services operational and secure.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-green-900/50 text-green-300">API Online</Badge>
                  <Badge className="bg-blue-900/50 text-blue-300">Database Healthy</Badge>
                  <Badge className="bg-purple-900/50 text-purple-300">Security Active</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Users</p>
                  <p className="text-2xl font-bold text-white">1,247</p>
                  <p className="text-xs text-green-400">+12% this month</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Sessions</p>
                  <p className="text-2xl font-bold text-white">89</p>
                  <p className="text-xs text-green-400">+5% today</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">₹2.4L</p>
                  <p className="text-xs text-green-400">+18% this month</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Alerts</p>
                  <p className="text-2xl font-bold text-white">2</p>
                  <p className="text-xs text-yellow-400">Requires attention</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Quick Admin Actions</CardTitle>
              <CardDescription className="text-gray-400">
                Common administrative tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-red-600 hover:bg-red-700">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                System Settings
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Content Management
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription className="text-gray-400">
                Latest system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { action: "New user registered", user: "Rahul Kumar", time: "2 minutes ago", type: "success" },
                  { action: "Payment processed", user: "Priya Sharma", time: "5 minutes ago", type: "success" },
                  { action: "Failed login attempt", user: "Unknown", time: "12 minutes ago", type: "warning" },
                  { action: "Content updated", user: "Admin", time: "1 hour ago", type: "info" }
                ].map((activity, index) => (
                  <div key={index} className="p-3 rounded-lg bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{activity.action}</p>
                        <p className="text-xs text-gray-400">{activity.user}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{activity.time}</p>
                        <Badge 
                          variant={activity.type === 'success' ? 'default' : activity.type === 'warning' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {activity.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Info */}
        <Card className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border-blue-800/50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Mobile Admin Panel</h3>
                <p className="text-gray-300 mb-4">
                  Secure administrative access with biometric authentication and encrypted connections.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-red-900/50 text-red-300">
                    Admin Access
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-900/50 text-blue-300">
                    Encrypted
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