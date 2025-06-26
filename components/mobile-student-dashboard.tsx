"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { motion } from "framer-motion"
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp,
  Brain,
  Timer,
  Award,
  MessageCircle,
  Plus,
  ChevronRight,
  Zap,
  CheckCircle
} from "lucide-react"

interface DashboardStats {
  studyHours: number
  sessionsCompleted: number
  currentStreak: number
  nextSession: string
  progress: number
  weakAreas: string[]
  recentAchievements: string[]
}

export default function MobileStudentDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    studyHours: 42,
    sessionsCompleted: 12,
    currentStreak: 7,
    nextSession: "Today 4:00 PM",
    progress: 68,
    weakAreas: ["Organic Chemistry", "Mechanics"],
    recentAchievements: ["Completed 10 sessions", "7-day streak"]
  })

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const quickActions = [
    { icon: Calendar, label: "Book Session", color: "bg-blue-500", action: "book-session" },
    { icon: BookOpen, label: "Study Plan", color: "bg-green-500", action: "study-plan" },
    { icon: MessageCircle, label: "Ask Doubt", color: "bg-purple-500", action: "ask-doubt" },
    { icon: Timer, label: "Study Timer", color: "bg-orange-500", action: "study-timer" }
  ]

  const upcomingSessions = [
    { subject: "Physics", topic: "Mechanics", time: "Today 4:00 PM", mentor: "Rahul Sir" },
    { subject: "Chemistry", topic: "Organic", time: "Tomorrow 10:00 AM", mentor: "Priya Ma'am" },
    { subject: "Mathematics", topic: "Calculus", time: "Wed 2:00 PM", mentor: "Amit Sir" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white p-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Good Morning! 👋</h1>
            <p className="text-slate-300">Ready to conquer JEE today?</p>
          </div>
          <div className="text-right">
            <Badge className="bg-green-500 text-white">
              <Zap className="w-3 h-3 mr-1" />
              {stats.currentStreak} day streak
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.studyHours}h</div>
            <div className="text-xs text-slate-300">Study Hours</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.sessionsCompleted}</div>
            <div className="text-xs text-slate-300">Sessions Done</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-r from-purple-800/50 to-blue-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">JEE Preparation Progress</h3>
              <Badge className="bg-purple-500 text-white">{stats.progress}%</Badge>
            </div>
            <Progress value={stats.progress} className="mb-2" />
            <div className="flex items-center text-sm text-slate-300">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Great progress! Keep it up!</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mb-6"
      >
        <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <motion.div
              key={index}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer"
            >
              <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 transition-colors">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm font-medium text-white">{action.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Next Session */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mb-6"
      >
        <Card className="bg-gradient-to-r from-green-800/50 to-teal-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-white mb-1">Next Session</h4>
                <p className="text-sm text-slate-300">Physics - Mechanics</p>
                <p className="text-sm text-green-400 font-medium">{stats.nextSession}</p>
              </div>
              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                Join
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Upcoming Sessions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Upcoming Sessions</h3>
          <Button variant="ghost" size="sm" className="text-blue-400">
            View All
          </Button>
        </div>
        <div className="space-y-2">
          {upcomingSessions.slice(0, 3).map((session, index) => (
            <Card key={index} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {session.subject}
                      </Badge>
                      <span className="text-sm font-medium text-white">
                        {session.topic}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300">
                      {session.time} • {session.mentor}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Weak Areas */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="mb-6"
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Brain className="w-5 h-5 mr-2 text-orange-400" />
              Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {stats.weakAreas.map((area, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                  <span className="text-sm text-white">{area}</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    Practice
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Achievements */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        className="mb-20"
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-400" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {stats.recentAchievements.map((achievement, index) => (
                <div key={index} className="flex items-center p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                  <span className="text-sm text-white">{achievement}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}