"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
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
import { Switch } from "@/components/ui/switch"
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
  Play, 
  Pause, 
  RotateCcw,
  ChevronDown,
  Sparkles,
  User,
  UserCheck
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
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
  question_goal?: number
  completed_questions?: number
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

export default function StudyPlanPage() {
  const [activeTab, setActiveTab] = useState("this-week")
  const [studyTasks, setStudyTasks] = useState<StudyTask[]>([])
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([])
  const [testScores, setTestScores] = useState<TestScore[]>([])
  const [studyStreak, setStudyStreak] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [nextWeekStart, setNextWeekStart] = useState<Date>(addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1))
  const [pomodoroActive, setPomodoroActive] = useState(false)
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25)
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0)
  const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus')
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null)
  const pomodoroIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  
  const [newTask, setNewTask] = useState({
    subject: "Physics",
    topic: "",
    duration: "",
    day: "Monday",
    notes: "",
    resource_link: "",
    authenticity: "self-decided",
    start_time: "09:00",
    end_time: "10:00",
    week_start: format(currentWeekStart, "yyyy-MM-dd"),
    question_goal: 0
  })
  
  // Fetch user data and study plans
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        if (!supabase) {
          console.error("Supabase client not initialized")
          setLoading(false)
          return
        }

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error("Authentication error:", userError)
          router.push('/auth/login')
          return
        }

        setUserId(user.id)

        // Get student data for streak
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('study_streak')
          .eq('id', user.id)
          .single()
        
        if (studentError && studentError.code !== 'PGRST116') {
          console.error("Student error:", studentError)
        } else if (studentData) {
          setStudyStreak(studentData.study_streak || 0)
        }

        // Get study plans for current week
        const currentWeekStartStr = format(currentWeekStart, "yyyy-MM-dd")
        const currentWeekEndStr = format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "yyyy-MM-dd")
        
        const { data: plans, error: plansError } = await supabase
          .from('study_plans')
          .select('*')
          .eq('student_id', user.id)
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

        // Get weak topics
        const { data: weakTopicsData, error: weakTopicsError } = await supabase
          .from('weak_topics')
          .select('*')
          .eq('student_id', user.id)
          .order('priority', { ascending: false })
        
        if (weakTopicsError) {
          console.error("Weak topics error:", weakTopicsError)
        } else if (weakTopicsData) {
          setWeakTopics(weakTopicsData)
        }

        // Get recent test scores
        const { data: testScoresData, error: testScoresError } = await supabase
          .from('tests')
          .select('*')
          .eq('student_id', user.id)
          .order('test_date', { ascending: false })
          .limit(5)
        
        if (testScoresError) {
          console.error("Test scores error:", testScoresError)
        } else if (testScoresData) {
          setTestScores(testScoresData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, currentWeekStart])

  // Pomodoro timer effect
  useEffect(() => {
    if (pomodoroActive) {
      pomodoroIntervalRef.current = setInterval(() => {
        if (pomodoroSeconds > 0) {
          setPomodoroSeconds(pomodoroSeconds - 1)
        } else if (pomodoroMinutes > 0) {
          setPomodoroMinutes(pomodoroMinutes - 1)
          setPomodoroSeconds(59)
        } else {
          // Timer completed
          if (pomodoroMode === 'focus') {
            // Switch to break mode
            setPomodoroMode('break')
            setPomodoroMinutes(5)
            setPomodoroSeconds(0)
            toast({
              title: "Break time!",
              description: "Take a 5-minute break before continuing.",
            })
          } else {
            // Switch back to focus mode
            setPomodoroMode('focus')
            setPomodoroMinutes(25)
            setPomodoroSeconds(0)
            toast({
              title: "Break over!",
              description: "Time to get back to studying.",
            })
          }
        }
      }, 1000)
    }

    return () => {
      if (pomodoroIntervalRef.current) {
        clearInterval(pomodoroIntervalRef.current)
      }
    }
  }, [pomodoroActive, pomodoroMinutes, pomodoroSeconds, pomodoroMode])

  const handleTaskCompletion = async (taskId: number, currentState: boolean) => {
    try {
      if (!supabase || !userId) return

      // Optimistically update UI
      setStudyTasks(studyTasks.map((task) => 
        task.id === taskId ? { ...task, completed: !currentState } : task
      ))

      // Update in database
      const { error } = await supabase
        .from('study_plans')
        .update({ is_completed: !currentState })
        .eq('id', taskId)
        .eq('student_id', userId)

      if (error) {
        console.error("Error updating task:", error)
        // Revert the optimistic update if there was an error
        setStudyTasks(studyTasks.map((task) => 
          task.id === taskId ? { ...task, completed: currentState } : task
        ))
        toast({
          title: "Error",
          description: "Failed to update task status. Please try again.",
          variant: "destructive"
        })
      } else {
        // If we're marking a task as completed, consider updating streak
        if (!currentState) {
          // Check if we completed all tasks for today
          const today = new Date()
          const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()]
          
          const todaysTasks = studyTasks.filter(task => task.day === dayOfWeek)
          const allCompleted = todaysTasks.every(task => 
            task.id === taskId ? true : task.completed
          )
          
          if (allCompleted && todaysTasks.length > 0) {
            // If all tasks for today are completed, update the streak
            const { error: streakError } = await supabase
              .from('students')
              .update({ study_streak: studyStreak + 1 })
              .eq('id', userId)
            
            if (!streakError) {
              setStudyStreak(prev => prev + 1)
              toast({
                title: "Streak updated!",
                description: `You've studied ${studyStreak + 1} days in a row! 🔥`,
              })
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in task completion:", error)
    }
  }

  const handleAddTask = async () => {
    try {
      if (!supabase || !userId || !newTask.topic || !newTask.duration || !newTask.start_time || !newTask.end_time) {
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
          student_id: userId,
          subject: newTask.subject,
          topic: newTask.topic,
          day_of_week: newTask.day,
          duration_hours: duration,
          is_completed: false,
          resource_link: newTask.resource_link || null,
          authenticity: newTask.authenticity,
          start_time: newTask.start_time,
          end_time: newTask.end_time,
          added_by: 'student',
          week_start: newTask.week_start,
          question_goal: newTask.question_goal > 0 ? newTask.question_goal : null,
          completed_questions: 0
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
          student_id: userId,
          resource_link: newTask.resource_link,
          authenticity: newTask.authenticity,
          start_time: newTask.start_time,
          end_time: newTask.end_time,
          added_by: 'student',
          question_goal: newTask.question_goal > 0 ? newTask.question_goal : undefined,
          completed_questions: 0,
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
          authenticity: "self-decided",
          start_time: "09:00",
          end_time: "10:00",
          week_start: format(currentWeekStart, "yyyy-MM-dd")
        })
        
        toast({
          title: "Task added",
          description: "Your new study task has been added to your plan"
        })
      }
    } catch (error) {
      console.error("Error in adding task:", error)
    }
  }

  const handleDeleteTask = async (taskId: number) => {
    try {
      if (!supabase || !userId) return

      // Optimistically update UI
      setStudyTasks(studyTasks.filter(task => task.id !== taskId))

      // Delete from database
      const { error } = await supabase
        .from('study_plans')
        .delete()
        .eq('id', taskId)
        .eq('student_id', userId)

      if (error) {
        console.error("Error deleting task:", error)
        // Fetch tasks again if there was an error
        const { data: plans } = await supabase
          .from('study_plans')
          .select('*')
          .eq('student_id', userId)
        
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
          description: "The study task has been removed from your plan"
        })
      }
    } catch (error) {
      console.error("Error in deleting task:", error)
    }
  }

  const handleStartPomodoro = (taskId: number) => {
    setActiveTaskId(taskId)
    setPomodoroMode('focus')
    setPomodoroMinutes(25)
    setPomodoroSeconds(0)
    setPomodoroActive(true)
    
    toast({
      title: "Pomodoro timer started",
      description: "Focus for 25 minutes, then take a 5-minute break."
    })
  }

  const handleStopPomodoro = () => {
    setPomodoroActive(false)
    setActiveTaskId(null)
    
    toast({
      title: "Pomodoro timer stopped",
      description: "You can restart the timer anytime."
    })
  }

  const handleResetPomodoro = () => {
    if (pomodoroMode === 'focus') {
      setPomodoroMinutes(25)
    } else {
      setPomodoroMinutes(5)
    }
    setPomodoroSeconds(0)
  }

  const handleAutoGeneratePlan = async () => {
    try {
      if (!supabase || !userId) return

      // Get weak topics
      const { data: weakTopicsData, error: weakTopicsError } = await supabase
        .from('weak_topics')
        .select('*')
        .eq('student_id', userId)
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
          description: "Please take some tests first to identify weak areas.",
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
          student_id: userId,
          subject: topic.subject,
          topic: topic.topic,
          day_of_week: day,
          duration_hours: topic.status === 'critical_weakness' ? 2 : 1.5,
          is_completed: false,
          resource_link: null,
          authenticity: 'auto-generated',
          start_time: `${startHour}:00`,
          end_time: `${startHour + 2}:00`,
          added_by: 'system',
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
          .eq('student_id', userId)
        
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
          description: `Created ${newTasks.length} study tasks based on your weak areas.`
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
        <p>Loading study plan...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Plan</h1>
          <p className="text-gray-600 mt-1">Organize your study schedule</p>
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
                <DialogDescription>Create a new task for your study plan</DialogDescription>
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
                  <Label htmlFor="authenticity" className="text-right">
                    Authenticity
                  </Label>
                  <Select 
                    value={newTask.authenticity} 
                    onValueChange={(value) => setNewTask({ ...newTask, authenticity: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select authenticity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="self-decided">Self-Decided</SelectItem>
                      <SelectItem value="mentor-assigned">Mentor-Assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="question_goal" className="text-right">
                    Question Goal
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Input
                      id="question_goal"
                      type="number"
                      min="0"
                      max="100"
                      value={newTask.question_goal}
                      onChange={(e) => setNewTask({ ...newTask, question_goal: parseInt(e.target.value) || 0 })}
                      className="flex-1"
                      placeholder="Number of questions to complete"
                    />
                    <div className="text-sm text-gray-500 whitespace-nowrap">
                      {newTask.subject === "Mathematics" 
                        ? "(8 min/question)"
                        : newTask.subject === "Physics"
                        ? "(5 min/question)"
                        : "(3 min/question)"
                      }
                    </div>
                  </div>
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
                  <Label htmlFor="notes" className="text-right">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={newTask.notes}
                    onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                    className="col-span-3"
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
                    Your study schedule for {format(currentWeekStart, "MMM d")} - {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), "MMM d, yyyy")}
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
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="link" className="h-auto p-0 text-xs mt-1">
                                          <UserCheck className="h-3 w-3 mr-1" />
                                          Mentor notes
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent>
                                        <p className="text-sm">{task.mentor_notes}</p>
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                </div>
                                <div className="flex flex-col space-y-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleTaskCompletion(task.id, task.completed)}
                                  >
                                    <CheckCircle
                                      className={`h-4 w-4 ${
                                        task.completed ? "text-green-500 fill-green-500" : "text-gray-300"
                                      }`}
                                    />
                                  </Button>
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
                                          onClick={() => handleStartPomodoro(task.id)}
                                        >
                                          <Play className="h-4 w-4 mr-2" />
                                          Start Timer
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
                    Your study schedule for {format(nextWeekStart, "MMM d")} - {format(endOfWeek(nextWeekStart, { weekStartsOn: 1 }), "MMM d, yyyy")}
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
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="link" className="h-auto p-0 text-xs mt-1">
                                          <UserCheck className="h-3 w-3 mr-1" />
                                          Mentor notes
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent>
                                        <p className="text-sm">{task.mentor_notes}</p>
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                </div>
                                <div className="flex flex-col space-y-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleTaskCompletion(task.id, task.completed)}
                                  >
                                    <CheckCircle
                                      className={`h-4 w-4 ${
                                        task.completed ? "text-green-500 fill-green-500" : "text-gray-300"
                                      }`}
                                    />
                                  </Button>
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
                                          onClick={() => handleStartPomodoro(task.id)}
                                        >
                                          <Play className="h-4 w-4 mr-2" />
                                          Start Timer
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
          {/* Pomodoro Timer */}
          <Card className={pomodoroActive ? "border-2 border-blue-500" : ""}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  {pomodoroActive ? (
                    <span className="flex items-center">
                      <span className="animate-pulse mr-2">⏱️</span> 
                      {pomodoroMode === 'focus' ? 'Focus Time' : 'Break Time'}
                    </span>
                  ) : (
                    "Pomodoro Timer"
                  )}
                </CardTitle>
                {!pomodoroActive && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/student/study-timer">
                      <Clock className="h-4 w-4 mr-2" />
                      Advanced Timer
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {pomodoroActive ? (
                <div className="text-center">
                  <div className="text-4xl font-bold mb-4">
                    {String(pomodoroMinutes).padStart(2, '0')}:{String(pomodoroSeconds).padStart(2, '0')}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    {pomodoroMode === 'focus' 
                      ? "Stay focused on your task" 
                      : "Take a short break"}
                  </p>
                  <div className="flex justify-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleStopPomodoro}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Stop
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleResetPomodoro}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Use the Pomodoro technique to stay focused:
                    <br />25 min focus + 5 min break
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled={studyTasks.length === 0}
                    onClick={() => {
                      if (studyTasks.length > 0) {
                        handleStartPomodoro(studyTasks[0].id)
                      }
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Timer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Study Streak */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Study Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{studyStreak} days</div>
                <p className="text-sm text-gray-600 mb-4">You've studied {studyStreak} days in a row!</p>
                <div className="text-2xl">🔥</div>
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
                  <p className="text-xs text-gray-400 mt-2">Take tests to identify weak areas</p>
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
    </div>
  )
}