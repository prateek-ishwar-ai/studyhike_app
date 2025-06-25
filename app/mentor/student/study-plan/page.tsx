"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  CheckCircle, 
  Clock, 
  Plus, 
  Calendar, 
  Link as LinkIcon, 
  AlertTriangle, 
  XCircle, 
  Edit, 
  Trash2, 
  ArrowLeft,
  ChevronDown,
  Sparkles,
  User,
  UserCheck,
  Info
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { format, addDays, startOfWeek, endOfWeek, addWeeks, parseISO, isWithinInterval } from "date-fns"

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const subjects = ["Physics", "Chemistry", "Mathematics", "Biology", "English", "History", "Geography", "Computer Science"]
const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0')
  return [`${hour}:00`, `${hour}:30`]
}).flat()

interface StudyTask {
  id: number
  subject: string
  topic: string
  duration: number
  day: string
  completed: boolean
  student_id: string
  resource_link?: string
  authenticity?: string
  start_time?: string
  end_time?: string
  added_by?: string
  mentor_notes?: string
  week_start?: string
}

interface WeakTopic {
  id: number
  subject: string
  topic: string
  status: string
  priority: number
}

interface TestScore {
  id: number
  subject: string
  score: number
  max_score: number
  test_date: string
  test_name: string
}

interface StudentProfile {
  id: string
  full_name: string
  avatar_url?: string
}

export default function MentorStudyPlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('studentId')
  
  const [activeTab, setActiveTab] = useState("this-week")
  const [studyTasks, setStudyTasks] = useState<StudyTask[]>([])
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([])
  const [testScores, setTestScores] = useState<TestScore[]>([])
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [studyStreak, setStudyStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [nextWeekStart, setNextWeekStart] = useState<Date>(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1))
  
  const [editingTask, setEditingTask] = useState<StudyTask | null>(null)
  const [newTask, setNewTask] = useState({
    subject: "Physics",
    topic: "",
    duration: "",
    day: "Monday",
    notes: "",
    resource_link: "",
    authenticity: "mentor-assigned",
    start_time: "09:00",
    end_time: "10:00",
    week_start: format(currentWeekStart, "yyyy-MM-dd"),
    mentor_notes: ""
  })
  
  // Fetch student data and study plans
  useEffect(() => {
    if (!studentId) {
      router.push('/mentor/students')
      return
    }
    
    async function fetchData() {
      try {
        setLoading(true)
        
        if (!supabase) {
          console.error("Supabase client not initialized")
          setLoading(false)
          return
        }

        // Create a default profile in case we can't fetch the real one
        let studentProfileData = {
          id: studentId,
          full_name: 'Student',
          avatar_url: undefined
        }

        try {
          // Get student profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', studentId)
            .single()
          
          if (!profileError && profileData) {
            studentProfileData = profileData
          } else {
            console.log("Could not fetch profile from profiles table, using default")
          }
        } catch (profileFetchError) {
          console.error("Error fetching profile:", profileFetchError)
        }
        
        // Set the profile data (either from database or default)
        setStudentProfile(studentProfileData)

        // Get student data for streak
        try {
          const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('study_streak')
            .eq('id', studentId)
            .single()
          
          if (studentError && studentError.code !== 'PGRST116') {
            console.error("Student error:", studentError)
          } else if (studentData) {
            setStudyStreak(studentData.study_streak || 0)
          }
        } catch (streakError) {
          console.error("Error fetching study streak:", streakError)
          // Continue with default streak value of 0
        }

        // Get study plans for current week
        try {
          const currentWeekStartStr = format(currentWeekStart, "yyyy-MM-dd")
          const currentWeekEndStr = format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "yyyy-MM-dd")
          
          const { data: plans, error: plansError } = await supabase
            .from('study_plans')
            .select('*')
            .eq('student_id', studentId)
            .or(`week_start.is.null,week_start.gte.${currentWeekStartStr},week_start.lte.${currentWeekEndStr}`)
          
          if (plansError) {
            console.error("Study plans error:", plansError)
          } else if (plans) {
            // Transform the data to match our StudyTask interface
            const transformedPlans = plans.map(plan => ({
              id: plan.id,
              subject: plan.subject,
              topic: plan.topic,
              duration: plan.duration_hours,
              day: plan.day_of_week,
              completed: plan.is_completed,
              student_id: plan.student_id,
              resource_link: plan.resource_link,
              authenticity: plan.authenticity || 'self-decided',
              start_time: plan.start_time,
              end_time: plan.end_time,
              added_by: plan.added_by || 'student',
              mentor_notes: plan.mentor_notes,
              week_start: plan.week_start
            }))
            
            setStudyTasks(transformedPlans)
          }
        } catch (plansError) {
          console.error("Error fetching study plans:", plansError)
          // Continue with empty study tasks
        }

        // Get weak topics
        try {
          const { data: weakTopicsData, error: weakTopicsError } = await supabase
            .from('weak_topics')
            .select('*')
            .eq('student_id', studentId)
            .order('priority', { ascending: false })
          
          if (weakTopicsError) {
            console.error("Weak topics error:", weakTopicsError)
          } else if (weakTopicsData) {
            setWeakTopics(weakTopicsData)
          }
        } catch (weakTopicsError) {
          console.error("Error fetching weak topics:", weakTopicsError)
          // Continue with empty weak topics
        }

        // Get recent test scores
        try {
          const { data: testScoresData, error: testScoresError } = await supabase
            .from('tests')
            .select('*')
            .eq('student_id', studentId)
            .order('test_date', { ascending: false })
            .limit(5)
          
          if (testScoresError) {
            console.error("Test scores error:", testScoresError)
          } else if (testScoresData) {
            setTestScores(testScoresData)
          }
        } catch (testScoresError) {
          console.error("Error fetching test scores:", testScoresError)
          // Continue with empty test scores
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, studentId, currentWeekStart])

  const handleAddTask = async () => {
    try {
      if (!supabase || !studentId || !newTask.topic || !newTask.duration || !newTask.start_time || !newTask.end_time) {
        toast({
          title: "Missing information",
          description: "Please fill in all required fields",
          variant: "destructive"
        })
        return
      }

      const duration = parseFloat(newTask.duration)
      if (isNaN(duration) || duration <= 0) {
        toast({
          title: "Invalid duration",
          description: "Please enter a valid positive number for duration",
          variant: "destructive"
        })
        return
      }

      // Validate time range
      if (newTask.start_time >= newTask.end_time) {
        toast({
          title: "Invalid time range",
          description: "End time must be after start time",
          variant: "destructive"
        })
        return
      }

      // Insert into database
      const { data, error } = await supabase
        .from('study_plans')
        .insert({
          student_id: studentId,
          subject: newTask.subject,
          topic: newTask.topic,
          day_of_week: newTask.day,
          duration_hours: duration,
          is_completed: false,
          resource_link: newTask.resource_link || null,
          authenticity: newTask.authenticity,
          start_time: newTask.start_time,
          end_time: newTask.end_time,
          added_by: 'mentor',
          mentor_notes: newTask.mentor_notes || null,
          week_start: newTask.week_start
        })
        .select('id')
        .single()

      if (error) {
        console.error("Error adding task:", error)
        toast({
          title: "Error",
          description: "Failed to add new task. Please try again.",
          variant: "destructive"
        })
      } else {
        // Add to local state with the returned ID
        const newTaskObj: StudyTask = {
          id: data.id,
          subject: newTask.subject,
          topic: newTask.topic,
          duration: duration,
          day: newTask.day,
          completed: false,
          student_id: studentId,
          resource_link: newTask.resource_link,
          authenticity: newTask.authenticity,
          start_time: newTask.start_time,
          end_time: newTask.end_time,
          added_by: 'mentor',
          mentor_notes: newTask.mentor_notes,
          week_start: newTask.week_start
        }

        setStudyTasks([...studyTasks, newTaskObj])
        
        // Reset form
        setNewTask({
          subject: "Physics",
          topic: "",
          duration: "",
          day: "Monday",
          notes: "",
          resource_link: "",
          authenticity: "mentor-assigned",
          start_time: "09:00",
          end_time: "10:00",
          week_start: format(currentWeekStart, "yyyy-MM-dd"),
          mentor_notes: ""
        })
        
        toast({
          title: "Task added",
          description: "New study task has been added to the student's plan"
        })
      }
    } catch (error) {
      console.error("Error in adding task:", error)
    }
  }

  const handleUpdateTask = async () => {
    try {
      if (!supabase || !studentId || !editingTask) return

      const duration = parseFloat(editingTask.duration.toString())
      if (isNaN(duration) || duration <= 0) {
        toast({
          title: "Invalid duration",
          description: "Please enter a valid positive number for duration",
          variant: "destructive"
        })
        return
      }

      // Validate time range
      if (editingTask.start_time && editingTask.end_time && editingTask.start_time >= editingTask.end_time) {
        toast({
          title: "Invalid time range",
          description: "End time must be after start time",
          variant: "destructive"
        })
        return
      }

      // Update in database
      const { error } = await supabase
        .from('study_plans')
        .update({
          subject: editingTask.subject,
          topic: editingTask.topic,
          day_of_week: editingTask.day,
          duration_hours: duration,
          resource_link: editingTask.resource_link || null,
          authenticity: editingTask.authenticity,
          start_time: editingTask.start_time,
          end_time: editingTask.end_time,
          mentor_notes: editingTask.mentor_notes || null,
          added_by: 'mentor' // Mark as edited by mentor
        })
        .eq('id', editingTask.id)
        .eq('student_id', studentId)

      if (error) {
        console.error("Error updating task:", error)
        toast({
          title: "Error",
          description: "Failed to update task. Please try again.",
          variant: "destructive"
        })
      } else {
        // Update local state
        setStudyTasks(studyTasks.map(task => 
          task.id === editingTask.id ? editingTask : task
        ))
        
        // Reset editing state
        setEditingTask(null)
        
        toast({
          title: "Task updated",
          description: "The study task has been updated"
        })
      }
    } catch (error) {
      console.error("Error in updating task:", error)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    try {
      if (!supabase || !studentId) return

      // Optimistically update UI
      setStudyTasks(studyTasks.filter(task => task.id !== taskId))

      // Delete from database
      const { error } = await supabase
        .from('study_plans')
        .delete()
        .eq('id', taskId)
        .eq('student_id', studentId)

      if (error) {
        console.error("Error deleting task:", error)
        // Fetch tasks again if there was an error
        const { data: plans } = await supabase
          .from('study_plans')
          .select('*')
          .eq('student_id', studentId)
        
        if (plans) {
          const transformedPlans = plans.map(plan => ({
            id: plan.id,
            subject: plan.subject,
            topic: plan.topic,
            duration: plan.duration_hours,
            day: plan.day_of_week,
            completed: plan.is_completed,
            student_id: plan.student_id,
            resource_link: plan.resource_link,
            authenticity: plan.authenticity || 'self-decided',
            start_time: plan.start_time,
            end_time: plan.end_time,
            added_by: plan.added_by || 'student',
            mentor_notes: plan.mentor_notes,
            week_start: plan.week_start
          }))
          
          setStudyTasks(transformedPlans)
        }

        toast({
          title: "Error",
          description: "Failed to delete task. Please try again.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Task deleted",
          description: "The study task has been removed from the plan"
        })
      }
    } catch (error) {
      console.error("Error in deleting task:", error)
    }
  }

  const handleAutoGeneratePlan = async () => {
    try {
      if (!supabase || !studentId) return

      // Get weak topics
      const { data: weakTopicsData, error: weakTopicsError } = await supabase
        .from('weak_topics')
        .select('*')
        .eq('student_id', studentId)
        .order('priority', { ascending: false })
      
      if (weakTopicsError) {
        console.error("Weak topics error:", weakTopicsError)
        toast({
          title: "Error",
          description: "Failed to fetch weak topics. Please try again.",
          variant: "destructive"
        })
        return
      }

      if (!weakTopicsData || weakTopicsData.length === 0) {
        toast({
          title: "No weak topics found",
          description: "Student needs to take some tests first to identify weak areas.",
          variant: "destructive"
        })
        return
      }

      // Generate a plan based on weak topics
      const weekStartStr = activeTab === "this-week" 
        ? format(currentWeekStart, "yyyy-MM-dd")
        : format(nextWeekStart, "yyyy-MM-dd")

      // Create a balanced plan across the week
      const newTasks = []
      const topicsToUse = weakTopicsData.slice(0, Math.min(7, weakTopicsData.length))
      
      for (let i = 0; i < topicsToUse.length; i++) {
        const topic = topicsToUse[i]
        const day = weekDays[i % 7]
        const startHour = 14 + (i % 8) // Start at 2 PM and distribute
        
        const newTask = {
          student_id: studentId,
          subject: topic.subject,
          topic: topic.topic,
          day_of_week: day,
          duration_hours: topic.status === 'critical_weakness' ? 2 : 1.5,
          is_completed: false,
          resource_link: null,
          authenticity: 'mentor-assigned',
          start_time: `${startHour}:00`,
          end_time: `${startHour + 2}:00`,
          added_by: 'mentor',
          mentor_notes: topic.status === 'critical_weakness' 
            ? 'Focus on this critical weakness area' 
            : 'This topic needs improvement',
          week_start: weekStartStr
        }
        
        newTasks.push(newTask)
      }

      // Insert all tasks
      const { data, error } = await supabase
        .from('study_plans')
        .insert(newTasks)
        .select('id')

      if (error) {
        console.error("Error adding auto-generated tasks:", error)
        toast({
          title: "Error",
          description: "Failed to auto-generate plan. Please try again.",
          variant: "destructive"
        })
      } else {
        // Refresh the tasks
        const { data: plans } = await supabase
          .from('study_plans')
          .select('*')
          .eq('student_id', studentId)
        
        if (plans) {
          const transformedPlans = plans.map(plan => ({
            id: plan.id,
            subject: plan.subject,
            topic: plan.topic,
            duration: plan.duration_hours,
            day: plan.day_of_week,
            completed: plan.is_completed,
            student_id: plan.student_id,
            resource_link: plan.resource_link,
            authenticity: plan.authenticity || 'self-decided',
            start_time: plan.start_time,
            end_time: plan.end_time,
            added_by: plan.added_by || 'student',
            mentor_notes: plan.mentor_notes,
            week_start: plan.week_start
          }))
          
          setStudyTasks(transformedPlans)
        }
        
        toast({
          title: "Plan auto-generated",
          description: `Created ${newTasks.length} study tasks based on student's weak areas.`
        })
      }
    } catch (error) {
      console.error("Error in auto-generating plan:", error)
    }
  }

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case "Physics":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Chemistry":
        return "bg-green-100 text-green-800 border-green-200"
      case "Mathematics":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "Biology":
        return "bg-red-100 text-red-800 border-red-200"
      case "English":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "History":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "Geography":
        return "bg-teal-100 text-teal-800 border-teal-200"
      case "Computer Science":
        return "bg-indigo-100 text-indigo-800 border-indigo-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical_weakness":
        return "bg-red-100 text-red-800 border-red-200"
      case "needs_improvement":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "good":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "critical_weakness":
        return "Critical Weakness"
      case "needs_improvement":
        return "Needs Improvement"
      case "good":
        return "Good"
      default:
        return "Unknown"
    }
  }

  const getWeekTasks = (weekStart: Date) => {
    const weekStartStr = format(weekStart, "yyyy-MM-dd")
    const weekEndStr = format(endOfWeek(weekStart, { weekStartsOn: 1 }), "yyyy-MM-dd")
    
    return studyTasks.filter(task => {
      // If task has no week_start, include it in current week
      if (!task.week_start && weekStart === currentWeekStart) {
        return true
      }
      
      // Otherwise, check if task's week_start is within the specified week
      if (task.week_start) {
        try {
          const taskDate = parseISO(task.week_start)
          return isWithinInterval(taskDate, {
            start: weekStart,
            end: endOfWeek(weekStart, { weekStartsOn: 1 })
          })
        } catch (e) {
          return false
        }
      }
      
      return false
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading student study plan...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Button 
            variant="ghost" 
            className="mb-2"
            onClick={() => router.push('/mentor/students')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            {studentProfile?.full_name || 'Student'}'s Study Plan
          </h1>
          <p className="text-gray-600 mt-1">Manage and optimize your student's study schedule</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleAutoGeneratePlan}>
            <Sparkles className="mr-2 h-4 w-4" />
            Auto-Generate Plan
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Study Task</DialogTitle>
                <DialogDescription>Create a new task for your student's study plan</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="subject" className="text-right">
                    Subject
                  </Label>
                  <Select value={newTask.subject} onValueChange={(value) => setNewTask({ ...newTask, subject: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="topic" className="text-right">
                    Topic/Portion
                  </Label>
                  <Input
                    id="topic"
                    value={newTask.topic}
                    onChange={(e) => setNewTask({ ...newTask, topic: e.target.value })}
                    className="col-span-3"
                    placeholder="e.g., Laws of Motion, NCERT Ex 5.2"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="resource_link" className="text-right">
                    Reference Link
                  </Label>
                  <Input
                    id="resource_link"
                    value={newTask.resource_link}
                    onChange={(e) => setNewTask({ ...newTask, resource_link: e.target.value })}
                    className="col-span-3"
                    placeholder="e.g., YouTube video or PDF link"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="duration" className="text-right">
                    Duration (hrs)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newTask.duration}
                    onChange={(e) => setNewTask({ ...newTask, duration: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="day" className="text-right">
                    Day
                  </Label>
                  <Select value={newTask.day} onValueChange={(value) => setNewTask({ ...newTask, day: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {weekDays.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="start_time" className="text-right">
                    Start Time
                  </Label>
                  <Select 
                    value={newTask.start_time} 
                    onValueChange={(value) => setNewTask({ ...newTask, start_time: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="end_time" className="text-right">
                    End Time
                  </Label>
                  <Select 
                    value={newTask.end_time} 
                    onValueChange={(value) => setNewTask({ ...newTask, end_time: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="week_start" className="text-right">
                    Week
                  </Label>
                  <Select 
                    value={newTask.week_start} 
                    onValueChange={(value) => setNewTask({ ...newTask, week_start: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select week" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={format(currentWeekStart, "yyyy-MM-dd")}>
                        This Week ({format(currentWeekStart, "MMM d")} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "MMM d")})
                      </SelectItem>
                      <SelectItem value={format(nextWeekStart, "yyyy-MM-dd")}>
                        Next Week ({format(nextWeekStart, "MMM d")} - {format(endOfWeek(nextWeekStart, { weekStartsOn: 1 }), "MMM d")})
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="mentor_notes" className="text-right">
                    Mentor Notes
                  </Label>
                  <Textarea
                    id="mentor_notes"
                    value={newTask.mentor_notes}
                    onChange={(e) => setNewTask({ ...newTask, mentor_notes: e.target.value })}
                    className="col-span-3"
                    placeholder="Add notes for the student about this task"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddTask}>Add Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <Tabs defaultValue="this-week" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="this-week">This Week</TabsTrigger>
              <TabsTrigger value="next-week">Next Week</TabsTrigger>
            </TabsList>
            <TabsContent value="this-week">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Study Plan</CardTitle>
                  <CardDescription>
                    Study schedule for {format(currentWeekStart, "MMM d")} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "MMM d, yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-4">
                    {weekDays.map((day) => (
                      <div key={day} className="text-center font-medium text-sm">
                        {day}
                      </div>
                    ))}
                    {weekDays.map((day) => (
                      <div key={day} className="border rounded-lg p-2 min-h-[200px] overflow-y-auto">
                        {getWeekTasks(currentWeekStart)
                          .filter((task) => task.day === day)
                          .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
                          .map((task) => (
                            <div
                              key={task.id}
                              className={`mb-2 p-2 rounded-md border ${getSubjectColor(task.subject)} ${
                                task.completed ? "opacity-50" : ""
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center">
                                    <p className="font-medium text-sm">{task.subject}</p>
                                    {task.added_by === 'mentor' && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        <UserCheck className="h-3 w-3 mr-1" />
                                        Mentor
                                      </Badge>
                                    )}
                                    {task.authenticity === 'auto-generated' && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Auto
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs">{task.topic}</p>
                                  {task.start_time && task.end_time && (
                                    <div className="flex items-center text-xs mt-1">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {task.start_time} - {task.end_time}
                                    </div>
                                  )}
                                  <div className="flex items-center text-xs mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {task.duration} hrs
                                  </div>
                                  {task.resource_link && (
                                    <a 
                                      href={task.resource_link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center text-xs mt-1 text-blue-600 hover:underline"
                                    >
                                      <LinkIcon className="h-3 w-3 mr-1" />
                                      Resource
                                    </a>
                                  )}
                                  {task.mentor_notes && (
                                    <div className="flex items-center text-xs mt-1 text-purple-600">
                                      <Info className="h-3 w-3 mr-1" />
                                      {task.mentor_notes}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col space-y-1">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                      >
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-2">
                                      <div className="flex flex-col space-y-1">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="justify-start"
                                          onClick={() => setEditingTask(task)}
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Task
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => handleDeleteTask(task.id)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="next-week">
              <Card>
                <CardHeader>
                  <CardTitle>Next Week's Plan</CardTitle>
                  <CardDescription>
                    Study schedule for {format(nextWeekStart, "MMM d")} - {format(endOfWeek(nextWeekStart, { weekStartsOn: 1 }), "MMM d, yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-4">
                    {weekDays.map((day) => (
                      <div key={day} className="text-center font-medium text-sm">
                        {day}
                      </div>
                    ))}
                    {weekDays.map((day) => (
                      <div key={day} className="border rounded-lg p-2 min-h-[200px] overflow-y-auto">
                        {getWeekTasks(nextWeekStart)
                          .filter((task) => task.day === day)
                          .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
                          .map((task) => (
                            <div
                              key={task.id}
                              className={`mb-2 p-2 rounded-md border ${getSubjectColor(task.subject)} ${
                                task.completed ? "opacity-50" : ""
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex items-center">
                                    <p className="font-medium text-sm">{task.subject}</p>
                                    {task.added_by === 'mentor' && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        <UserCheck className="h-3 w-3 mr-1" />
                                        Mentor
                                      </Badge>
                                    )}
                                    {task.authenticity === 'auto-generated' && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        Auto
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs">{task.topic}</p>
                                  {task.start_time && task.end_time && (
                                    <div className="flex items-center text-xs mt-1">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {task.start_time} - {task.end_time}
                                    </div>
                                  )}
                                  <div className="flex items-center text-xs mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {task.duration} hrs
                                  </div>
                                  {task.resource_link && (
                                    <a 
                                      href={task.resource_link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center text-xs mt-1 text-blue-600 hover:underline"
                                    >
                                      <LinkIcon className="h-3 w-3 mr-1" />
                                      Resource
                                    </a>
                                  )}
                                  {task.mentor_notes && (
                                    <div className="flex items-center text-xs mt-1 text-purple-600">
                                      <Info className="h-3 w-3 mr-1" />
                                      {task.mentor_notes}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col space-y-1">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                      >
                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-2">
                                      <div className="flex flex-col space-y-1">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="justify-start"
                                          onClick={() => setEditingTask(task)}
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Task
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => handleDeleteTask(task.id)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </Button>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Student Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-800 mb-2">{studentProfile?.full_name || 'Student'}</div>
                <div className="flex items-center justify-center space-x-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Study Streak</p>
                    <p className="text-lg font-bold text-blue-600">{studyStreak} days 🔥</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tasks</p>
                    <p className="text-lg font-bold text-green-600">
                      {studyTasks.filter(t => t.completed).length}/{studyTasks.length}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weak Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weak Topics</CardTitle>
            </CardHeader>
            <CardContent>
              {weakTopics.length > 0 ? (
                <div className="space-y-2">
                  {weakTopics.slice(0, 5).map((topic) => (
                    <div 
                      key={topic.id} 
                      className={`p-2 rounded-md border ${getStatusColor(topic.status)}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{topic.subject}</p>
                          <p className="text-xs">{topic.topic}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {getStatusText(topic.status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No weak topics identified yet</p>
                  <p className="text-xs text-gray-400 mt-2">Student needs to take tests first</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={handleAutoGeneratePlan}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Plan from Weak Topics
              </Button>
            </CardFooter>
          </Card>

          {/* Recent Test Scores */}
          {testScores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Test Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testScores.slice(0, 3).map((test) => (
                    <div key={test.id} className="space-y-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium">{test.subject}</p>
                        <p className="text-sm font-medium">{test.score}/{test.max_score}</p>
                      </div>
                      <Progress value={(test.score / test.max_score) * 100} className="h-2" />
                      <p className="text-xs text-gray-500">{test.test_name} - {format(new Date(test.test_date), "MMM d, yyyy")}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Study Task</DialogTitle>
            <DialogDescription>Modify this task in the student's study plan</DialogDescription>
          </DialogHeader>
          {editingTask && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-subject" className="text-right">
                  Subject
                </Label>
                <Select 
                  value={editingTask.subject} 
                  onValueChange={(value) => setEditingTask({ ...editingTask, subject: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-topic" className="text-right">
                  Topic/Portion
                </Label>
                <Input
                  id="edit-topic"
                  value={editingTask.topic}
                  onChange={(e) => setEditingTask({ ...editingTask, topic: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-resource_link" className="text-right">
                  Reference Link
                </Label>
                <Input
                  id="edit-resource_link"
                  value={editingTask.resource_link || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, resource_link: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-duration" className="text-right">
                  Duration (hrs)
                </Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={editingTask.duration}
                  onChange={(e) => setEditingTask({ ...editingTask, duration: parseFloat(e.target.value) || 0 })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-day" className="text-right">
                  Day
                </Label>
                <Select 
                  value={editingTask.day} 
                  onValueChange={(value) => setEditingTask({ ...editingTask, day: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {weekDays.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-start_time" className="text-right">
                  Start Time
                </Label>
                <Select 
                  value={editingTask.start_time || ''} 
                  onValueChange={(value) => setEditingTask({ ...editingTask, start_time: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-end_time" className="text-right">
                  End Time
                </Label>
                <Select 
                  value={editingTask.end_time || ''} 
                  onValueChange={(value) => setEditingTask({ ...editingTask, end_time: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-mentor_notes" className="text-right">
                  Mentor Notes
                </Label>
                <Textarea
                  id="edit-mentor_notes"
                  value={editingTask.mentor_notes || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, mentor_notes: e.target.value })}
                  className="col-span-3"
                  placeholder="Add notes for the student about this task"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
            <Button onClick={handleUpdateTask}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}