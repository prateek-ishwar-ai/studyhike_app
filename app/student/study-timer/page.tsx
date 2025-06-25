"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SubjectTimer } from "@/components/ui/subject-timer"
import { BreakTimer } from "@/components/ui/break-timer"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { Clock, BookOpen, Calendar, CheckCircle, AlertCircle, ArrowLeft, Plus, Sparkles, Play } from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface StudyPlan {
  id: number
  subject: string
  topic: string
  duration: number
  day: string
  completed: boolean
  student_id: string
  start_time?: string
  end_time?: string
  question_goal?: number
  completed_questions?: number
}

interface SubjectGoal {
  subject: "Mathematics" | "Physics" | "Chemistry" | "Revision"
  questionGoal: number
  completedQuestions: number
}

export default function StudyTimerPage() {
  const [activeSubject, setActiveSubject] = useState<"Mathematics" | "Physics" | "Chemistry" | "Revision">("Revision")
  const [showBreakTimer, setShowBreakTimer] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [todaysPlans, setTodaysPlans] = useState<StudyPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [subjectGoals, setSubjectGoals] = useState<SubjectGoal[]>([
    { subject: "Mathematics", questionGoal: 10, completedQuestions: 0 },
    { subject: "Physics", questionGoal: 20, completedQuestions: 0 },
    { subject: "Chemistry", questionGoal: 30, completedQuestions: 0 },
    { subject: "Revision", questionGoal: 0, completedQuestions: 0 }
  ])
  const [newGoal, setNewGoal] = useState<SubjectGoal>({
    subject: "Mathematics",
    questionGoal: 10,
    completedQuestions: 0
  })
  const router = useRouter()
  
  // Check for subject query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const subjectParam = params.get('subject')
      
      if (subjectParam === 'Mathematics' || subjectParam === 'Physics' || subjectParam === 'Chemistry') {
        setActiveSubject(subjectParam)
        
        toast({
          title: `${subjectParam} selected`,
          description: `Starting timer for ${subjectParam} questions`,
        })
      }
    }
  }, [])
  
  // Fetch user data and today's study plans
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

        // Get today's study plans
        const today = new Date()
        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()]
        
        const { data: plans, error: plansError } = await supabase
          .from('study_plans')
          .select('*')
          .eq('student_id', user.id)
          .eq('day_of_week', dayOfWeek)
        
        if (plansError) {
          console.error("Study plans error:", plansError)
        } else if (plans) {
          // Transform the data
          const transformedPlans = plans.map(plan => ({
            id: plan.id,
            subject: plan.subject,
            topic: plan.topic,
            duration: plan.duration_hours,
            day: plan.day_of_week,
            completed: plan.is_completed,
            student_id: plan.student_id,
            start_time: plan.start_time,
            end_time: plan.end_time,
            question_goal: plan.question_goal || 0,
            completed_questions: plan.completed_questions || 0
          }))
          
          setTodaysPlans(transformedPlans)
          
          // Update subject goals from plans
          const updatedGoals = [...subjectGoals]
          
          transformedPlans.forEach(plan => {
            const subjectIndex = updatedGoals.findIndex(goal => goal.subject === plan.subject)
            if (subjectIndex !== -1 && plan.question_goal) {
              updatedGoals[subjectIndex].questionGoal = plan.question_goal
              updatedGoals[subjectIndex].completedQuestions = plan.completed_questions || 0
            }
          })
          
          setSubjectGoals(updatedGoals)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])
  
  // Handle subject timer completion
  const handleSubjectComplete = () => {
    setShowBreakTimer(true)
    
    toast({
      title: `${activeSubject} session complete!`,
      description: "Take a 20-minute break before starting the next subject.",
    })
  }
  
  // Handle break timer completion
  const handleBreakComplete = () => {
    setShowBreakTimer(false)
    
    // Always go to Revision after a break, before starting the next subject
    setActiveSubject("Revision")
    
    // Determine which subject we'll be preparing for
    let nextSubject = "Mathematics";
    if (activeSubject === "Revision") {
      nextSubject = "Mathematics";
    } else if (activeSubject === "Mathematics") {
      nextSubject = "Physics";
    } else if (activeSubject === "Physics") {
      nextSubject = "Chemistry";
    } else {
      nextSubject = "Mathematics";
    }
    
    toast({
      title: "Break complete!",
      description: `Starting 1-hour revision before ${nextSubject} practice.`,
    })
  }
  
  // Handle question completion
  const handleQuestionComplete = async (completed: boolean) => {
    if (completed) {
      // Update local state
      const updatedGoals = [...subjectGoals]
      const subjectIndex = updatedGoals.findIndex(goal => goal.subject === activeSubject)
      
      if (subjectIndex !== -1) {
        updatedGoals[subjectIndex].completedQuestions += 1
        setSubjectGoals(updatedGoals)
        
        // Update in database if we have a user ID
        if (userId) {
          try {
            // Find the plan for this subject
            const plan = todaysPlans.find(p => p.subject === activeSubject)
            
            if (plan) {
              const { error } = await supabase
                .from('study_plans')
                .update({ 
                  completed_questions: (plan.completed_questions || 0) + 1 
                })
                .eq('id', plan.id)
              
              if (error) {
                console.error("Error updating completed questions:", error)
              } else {
                // Update local plans state
                const updatedPlans = todaysPlans.map(p => 
                  p.id === plan.id 
                    ? { ...p, completed_questions: (p.completed_questions || 0) + 1 } 
                    : p
                )
                setTodaysPlans(updatedPlans)
                
                // Show success message
                toast({
                  title: `Progress updated!`,
                  description: `You've completed ${updatedGoals[subjectIndex].completedQuestions} out of ${updatedGoals[subjectIndex].questionGoal} ${activeSubject} questions.`,
                  variant: "default",
                })
                
                // Also update progress in other relevant tables if needed
                try {
                  // Update user_progress table if it exists
                  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                  
                  const { data: existingProgress, error: fetchError } = await supabase
                    .from('user_progress')
                    .select('*')
                    .eq('student_id', userId)
                    .eq('date', today)
                    .eq('subject', activeSubject)
                    .single();
                    
                  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
                    console.error("Error fetching progress:", fetchError);
                  } else if (existingProgress) {
                    // Update existing progress
                    await supabase
                      .from('user_progress')
                      .update({
                        questions_completed: existingProgress.questions_completed + 1,
                        last_updated: new Date().toISOString()
                      })
                      .eq('id', existingProgress.id);
                  } else {
                    // Create new progress entry
                    await supabase
                      .from('user_progress')
                      .insert({
                        student_id: userId,
                        date: today,
                        subject: activeSubject,
                        questions_completed: 1,
                        study_time_minutes: activeSubject === "Mathematics" ? 8 : 
                                           activeSubject === "Physics" ? 5 : 
                                           activeSubject === "Chemistry" ? 3 : 60,
                        last_updated: new Date().toISOString()
                      });
                  }
                } catch (progressError) {
                  console.error("Error updating progress:", progressError);
                }
              }
            }
          } catch (error) {
            console.error("Error updating question completion:", error)
          }
        }
      }
    }
  }
  
  // Handle adding a new question goal
  const handleAddGoal = async () => {
    // Update local state
    const updatedGoals = [...subjectGoals]
    const subjectIndex = updatedGoals.findIndex(goal => goal.subject === newGoal.subject)
    
    if (subjectIndex !== -1) {
      updatedGoals[subjectIndex].questionGoal = newGoal.questionGoal
      setSubjectGoals(updatedGoals)
      
      // Update in database if we have a user ID
      if (userId) {
        try {
          // Find the plan for this subject
          const plan = todaysPlans.find(p => p.subject === newGoal.subject)
          
          if (plan) {
            const { error } = await supabase
              .from('study_plans')
              .update({ question_goal: newGoal.questionGoal })
              .eq('id', plan.id)
            
            if (error) {
              console.error("Error updating question goal:", error)
            } else {
              // Update local plans state
              const updatedPlans = todaysPlans.map(p => 
                p.id === plan.id 
                  ? { ...p, question_goal: newGoal.questionGoal } 
                  : p
              )
              setTodaysPlans(updatedPlans)
              
              toast({
                title: "Goal updated",
                description: `Set goal of ${newGoal.questionGoal} questions for ${newGoal.subject}.`,
              })
            }
          } else {
            // No plan exists for this subject, create a new one
            const today = new Date()
            const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()]
            
            const { error, data } = await supabase
              .from('study_plans')
              .insert({
                subject: newGoal.subject,
                topic: `${newGoal.subject} practice`,
                duration_hours: newGoal.subject === "Mathematics" ? 8 * newGoal.questionGoal / 60 : 
                               newGoal.subject === "Physics" ? 5 * newGoal.questionGoal / 60 : 
                               newGoal.subject === "Chemistry" ? 3 * newGoal.questionGoal / 60 : 1,
                day_of_week: dayOfWeek,
                is_completed: false,
                student_id: userId,
                question_goal: newGoal.questionGoal,
                completed_questions: 0,
                authenticity: 'self-decided',
                week_start: new Date().toISOString().split('T')[0] // yyyy-MM-dd format
              })
              .select()
            
            // Also create a revision plan if it doesn't exist
            if (!todaysPlans.some(p => p.subject === "Revision")) {
              await supabase
                .from('study_plans')
                .insert({
                  subject: "Revision",
                  topic: "General revision before practice",
                  duration_hours: 1, // 1 hour of revision
                  day_of_week: dayOfWeek,
                  is_completed: false,
                  student_id: userId,
                  authenticity: 'self-decided',
                  week_start: new Date().toISOString().split('T')[0] // yyyy-MM-dd format
                })
            }
            
            if (error) {
              console.error("Error creating study plan:", error)
            } else if (data && data.length > 0) {
              // Add the new plan to local state
              const newPlan = {
                id: data[0].id,
                subject: data[0].subject,
                topic: data[0].topic,
                duration: data[0].duration_hours,
                day: data[0].day_of_week,
                completed: data[0].is_completed,
                student_id: data[0].student_id,
                question_goal: data[0].question_goal,
                completed_questions: data[0].completed_questions
              }
              
              setTodaysPlans([...todaysPlans, newPlan])
              
              toast({
                title: "New plan created",
                description: `Created plan with ${newGoal.questionGoal} questions for ${newGoal.subject}.`,
              })
            }
          }
        } catch (error) {
          console.error("Error saving question goal:", error)
        }
      }
    }
    
    // Close the dialog
    setShowGoalDialog(false)
  }
  
  // Get subject-specific plans
  const getSubjectPlans = (subject: string) => {
    return todaysPlans.filter(plan => plan.subject === subject)
  }
  
  // Get question goal for a subject
  const getQuestionGoal = (subject: "Mathematics" | "Physics" | "Chemistry" | "Revision") => {
    const goal = subjectGoals.find(g => g.subject === subject)
    return goal ? goal.questionGoal : 0
  }
  
  // Get completed questions for a subject
  const getCompletedQuestions = (subject: "Mathematics" | "Physics" | "Chemistry" | "Revision") => {
    const goal = subjectGoals.find(g => g.subject === subject)
    return goal ? goal.completedQuestions : 0
  }
  
  // Calculate total study time
  const calculateTotalStudyTime = () => {
    // Start with 1 hour for initial revision
    let totalMinutes = 60; 
    
    // Add time for each subject
    subjectGoals.forEach(goal => {
      if (goal.subject === "Mathematics") {
        totalMinutes += goal.questionGoal * 8; // 8 minutes per question
      } else if (goal.subject === "Physics") {
        totalMinutes += goal.questionGoal * 5; // 5 minutes per question
      } else if (goal.subject === "Chemistry") {
        totalMinutes += goal.questionGoal * 3; // 3 minutes per question
      }
    });
    
    // Add 20 minutes break after each subject
    totalMinutes += 20 * 3; // 3 breaks
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <h3 className="text-lg font-medium text-gray-700">Loading study timer...</h3>
        <p className="text-gray-500 text-sm">Preparing your personalized study session</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Timer</h1>
          <p className="text-gray-600 mt-1">Manage your study sessions with subject-specific timers</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setShowGoalDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Set Question Goals
          </Button>
          <Button variant="outline" asChild>
            <Link href="/student/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Subject Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Subject</CardTitle>
              <CardDescription>Choose the subject you're currently studying</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant={activeSubject === "Revision" ? "default" : "outline"}
                  className={activeSubject === "Revision" ? "bg-orange-600 hover:bg-orange-700" : ""}
                  onClick={() => setActiveSubject("Revision")}
                >
                  Revision
                </Button>
                <Button 
                  variant={activeSubject === "Mathematics" ? "default" : "outline"}
                  className={activeSubject === "Mathematics" ? "bg-purple-600 hover:bg-purple-700" : ""}
                  onClick={() => setActiveSubject("Mathematics")}
                >
                  Mathematics
                </Button>
                <Button 
                  variant={activeSubject === "Physics" ? "default" : "outline"}
                  className={activeSubject === "Physics" ? "bg-blue-600 hover:bg-blue-700" : ""}
                  onClick={() => setActiveSubject("Physics")}
                >
                  Physics
                </Button>
                <Button 
                  variant={activeSubject === "Chemistry" ? "default" : "outline"}
                  className={activeSubject === "Chemistry" ? "bg-green-600 hover:bg-green-700" : ""}
                  onClick={() => setActiveSubject("Chemistry")}
                >
                  Chemistry
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Active Timer */}
          {showBreakTimer ? (
            <BreakTimer onComplete={handleBreakComplete} />
          ) : (
            <SubjectTimer 
              subject={activeSubject} 
              onComplete={handleSubjectComplete}
              onQuestionComplete={handleQuestionComplete}
              totalQuestions={getQuestionGoal(activeSubject)}
            />
          )}
          
          {/* Timer Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Timer Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 text-purple-800 p-2 rounded-full">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Mathematics Timer</h3>
                    <p className="text-sm text-gray-600">8 minutes per question. Focus on solving one problem at a time.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 text-blue-800 p-2 rounded-full">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Physics Timer</h3>
                    <p className="text-sm text-gray-600">5 minutes per question. Balance theory application and calculations.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 text-green-800 p-2 rounded-full">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Chemistry Timer</h3>
                    <p className="text-sm text-gray-600">3 minutes per question. Focus on quick recall and application.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-100 text-orange-800 p-2 rounded-full">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Revision Timer</h3>
                    <p className="text-sm text-gray-600">1 hour continuous study. Review concepts before practice.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {/* Study Session Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Study Session Overview</CardTitle>
              <CardDescription>Your planned study time today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Study Time:</span>
                  <span className="font-bold">{calculateTotalStudyTime()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Questions Planned:</span>
                  <span className="font-bold">
                    {subjectGoals.reduce((total, goal) => total + goal.questionGoal, 0)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Questions Completed:</span>
                  <span className="font-bold">
                    {subjectGoals.reduce((total, goal) => total + goal.completedQuestions, 0)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress:</span>
                  <span className="font-bold">
                    {Math.round(
                      (subjectGoals.reduce((total, goal) => total + goal.completedQuestions, 0) / 
                      Math.max(1, subjectGoals.reduce((total, goal) => total + goal.questionGoal, 0))) * 100
                    )}%
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ 
                      width: `${Math.round(
                        (subjectGoals.reduce((total, goal) => total + goal.completedQuestions, 0) / 
                        Math.max(1, subjectGoals.reduce((total, goal) => total + goal.questionGoal, 0))) * 100
                      )}%` 
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Subject Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Goals</CardTitle>
              <CardDescription>Questions to complete today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subjectGoals.some(goal => goal.questionGoal > 0) ? (
                  <div className="space-y-4">
                    {/* Mathematics */}
                    {getQuestionGoal("Mathematics") > 0 && (
                      <div className="p-3 rounded-md border bg-purple-50 border-purple-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-purple-800">Mathematics</p>
                            <p className="text-sm text-purple-600">
                              {getCompletedQuestions("Mathematics")}/{getQuestionGoal("Mathematics")} questions
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-purple-700"
                            onClick={() => {
                              setActiveSubject("Mathematics")
                              toast({
                                title: "Mathematics selected",
                                description: "Starting timer for Mathematics questions",
                              })
                            }}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="w-full bg-purple-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ 
                              width: `${getQuestionGoal("Mathematics") > 0 
                                ? (getCompletedQuestions("Mathematics") / getQuestionGoal("Mathematics")) * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                          {Math.round((getCompletedQuestions("Mathematics") / getQuestionGoal("Mathematics")) * 100)}% complete
                        </p>
                      </div>
                    )}
                    
                    {/* Physics */}
                    {getQuestionGoal("Physics") > 0 && (
                      <div className="p-3 rounded-md border bg-blue-50 border-blue-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-blue-800">Physics</p>
                            <p className="text-sm text-blue-600">
                              {getCompletedQuestions("Physics")}/{getQuestionGoal("Physics")} questions
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-700"
                            onClick={() => {
                              setActiveSubject("Physics")
                              toast({
                                title: "Physics selected",
                                description: "Starting timer for Physics questions",
                              })
                            }}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${getQuestionGoal("Physics") > 0 
                                ? (getCompletedQuestions("Physics") / getQuestionGoal("Physics")) * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          {Math.round((getCompletedQuestions("Physics") / getQuestionGoal("Physics")) * 100)}% complete
                        </p>
                      </div>
                    )}
                    
                    {/* Chemistry */}
                    {getQuestionGoal("Chemistry") > 0 && (
                      <div className="p-3 rounded-md border bg-green-50 border-green-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-green-800">Chemistry</p>
                            <p className="text-sm text-green-600">
                              {getCompletedQuestions("Chemistry")}/{getQuestionGoal("Chemistry")} questions
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-green-700"
                            onClick={() => {
                              setActiveSubject("Chemistry")
                              toast({
                                title: "Chemistry selected",
                                description: "Starting timer for Chemistry questions",
                              })
                            }}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ 
                              width: `${getQuestionGoal("Chemistry") > 0 
                                ? (getCompletedQuestions("Chemistry") / getQuestionGoal("Chemistry")) * 100 
                                : 0}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          {Math.round((getCompletedQuestions("Chemistry") / getQuestionGoal("Chemistry")) * 100)}% complete
                        </p>
                      </div>
                    )}
                    
                    {/* Revision */}
                    <div className="p-3 rounded-md border bg-orange-50 border-orange-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-orange-800">Revision</p>
                          <p className="text-sm text-orange-600">1 hour continuous study</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0 text-orange-700"
                          onClick={() => {
                            setActiveSubject("Revision")
                            toast({
                              title: "Revision selected",
                              description: "Starting 1-hour revision timer",
                            })
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No question goals set</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setShowGoalDialog(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Set Question Goals
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Recommended Study Flow */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Study Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-2 bg-orange-100 rounded-md">
                  <div className="bg-orange-200 text-orange-800 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">1</div>
                  <div className="flex-1">
                    <p className="font-medium">Initial Revision (1 hour)</p>
                    <p className="text-xs text-gray-600">Review key concepts before starting</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-2 bg-purple-100 rounded-md">
                  <div className="bg-purple-200 text-purple-800 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">2</div>
                  <div className="flex-1">
                    <p className="font-medium">Mathematics ({getQuestionGoal("Mathematics")} questions)</p>
                    <p className="text-xs text-gray-600">8 minutes per question</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-2 bg-teal-100 rounded-md">
                  <div className="bg-teal-200 text-teal-800 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">3</div>
                  <div className="flex-1">
                    <p className="font-medium">Break (20 minutes)</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-2 bg-orange-100 rounded-md">
                  <div className="bg-orange-200 text-orange-800 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">4</div>
                  <div className="flex-1">
                    <p className="font-medium">Physics Revision (1 hour)</p>
                    <p className="text-xs text-gray-600">Review physics concepts</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-2 bg-blue-100 rounded-md">
                  <div className="bg-blue-200 text-blue-800 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">5</div>
                  <div className="flex-1">
                    <p className="font-medium">Physics ({getQuestionGoal("Physics")} questions)</p>
                    <p className="text-xs text-gray-600">5 minutes per question</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-2 bg-teal-100 rounded-md">
                  <div className="bg-teal-200 text-teal-800 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">6</div>
                  <div className="flex-1">
                    <p className="font-medium">Break (20 minutes)</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-2 bg-orange-100 rounded-md">
                  <div className="bg-orange-200 text-orange-800 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">7</div>
                  <div className="flex-1">
                    <p className="font-medium">Chemistry Revision (1 hour)</p>
                    <p className="text-xs text-gray-600">Review chemistry concepts</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 p-2 bg-green-100 rounded-md">
                  <div className="bg-green-200 text-green-800 rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">8</div>
                  <div className="flex-1">
                    <p className="font-medium">Chemistry ({getQuestionGoal("Chemistry")} questions)</p>
                    <p className="text-xs text-gray-600">3 minutes per question</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Question Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Question Goals</DialogTitle>
            <DialogDescription>
              Set the number of questions you want to complete for each subject today.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject
              </Label>
              <Select 
                value={newGoal.subject} 
                onValueChange={(value: "Mathematics" | "Physics" | "Chemistry" | "Revision") => 
                  setNewGoal({ ...newGoal, subject: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="questionGoal" className="text-right">
                Question Goal
              </Label>
              <Input
                id="questionGoal"
                type="number"
                min="1"
                max="100"
                value={newGoal.questionGoal}
                onChange={(e) => setNewGoal({ ...newGoal, questionGoal: parseInt(e.target.value) || 0 })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right col-span-1">
                <span className="text-sm text-gray-500">Time Required:</span>
              </div>
              <div className="col-span-3">
                <span className="font-medium">
                  {newGoal.subject === "Mathematics" 
                    ? Math.round(newGoal.questionGoal * 8 / 60 * 10) / 10
                    : newGoal.subject === "Physics"
                    ? Math.round(newGoal.questionGoal * 5 / 60 * 10) / 10
                    : Math.round(newGoal.questionGoal * 3 / 60 * 10) / 10
                  } hours
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  ({newGoal.subject === "Mathematics" 
                    ? "8 min/question"
                    : newGoal.subject === "Physics"
                    ? "5 min/question"
                    : "3 min/question"
                  })
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAddGoal}>
              <Sparkles className="mr-2 h-4 w-4" />
              Set Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper function to get subject color
function getSubjectColor(subject: string) {
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