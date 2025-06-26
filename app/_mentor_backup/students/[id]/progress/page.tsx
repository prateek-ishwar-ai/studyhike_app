"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { Line, Bar } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js"
import { CalendarDays, BookOpen, TrendingUp, Award, AlertCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend)

interface StudentInfo {
  id: string
  fullName: string
  email: string
  studyStreak: number
  totalHomework: number
  completedHomework: number
  totalSessions: number
  attendedSessions: number
  subjects: string[]
}

export default function StudentProgressPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionData, setSessionData] = useState<any>({
    labels: [],
    datasets: [],
  })
  const [homeworkData, setHomeworkData] = useState<any>({
    labels: [],
    datasets: [],
  })
  
  // Progress by subject
  const [subjectProgress, setSubjectProgress] = useState<any[]>([])
  
  useEffect(() => {
    if (!user || !params.id) return
    
    async function fetchStudentProgress() {
      try {
        setLoading(true)
        setError(null)
        
        // Check if we're in demo mode
        const isDemoMode = window.localStorage.getItem('demo_mentor_mode') === 'true' || !supabase;
        
        if (isDemoMode) {
          console.log("Using demo data for student progress page");
          
          // Create a mock student
          const mockStudent = {
            id: params.id,
            fullName: params.id === "student-1" ? "Alex Johnson" : 
                      params.id === "student-2" ? "Emma Davis" : "Ryan Smith",
            email: params.id === "student-1" ? "alex@example.com" : 
                   params.id === "student-2" ? "emma@example.com" : "ryan@example.com",
            studyStreak: 12,
            totalHomework: 15,
            completedHomework: 12,
            totalSessions: 20,
            attendedSessions: 18,
            subjects: ["Mathematics", "Physics", "Chemistry"]
          };
          
          setStudent(mockStudent);
          
          // Create session data for chart
          const mockSessionData = {
            labels: ["Jan 2023", "Feb 2023", "Mar 2023", "Apr 2023", "May 2023", "Jun 2023"],
            datasets: [
              {
                label: 'Completed Sessions',
                data: [2, 3, 4, 3, 5, 4],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
              }
            ]
          };
          
          setSessionData(mockSessionData);
          
          // Create homework data for chart
          const mockHomeworkData = {
            labels: ["Mathematics", "Physics", "Chemistry"],
            datasets: [
              {
                label: 'Average Grade',
                data: [92.5, 85.0, 78.5],
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
              }
            ]
          };
          
          setHomeworkData(mockHomeworkData);
          
          // Create subject progress data
          const mockSubjectProgress = [
            {
              subject: "Mathematics",
              percentComplete: 90,
              avgGrade: 92.5,
              completed: 9,
              total: 10
            },
            {
              subject: "Physics",
              percentComplete: 80,
              avgGrade: 85.0,
              completed: 4,
              total: 5
            },
            {
              subject: "Chemistry",
              percentComplete: 66.7,
              avgGrade: 78.5,
              completed: 0,
              total: 0
            }
          ];
          
          setSubjectProgress(mockSubjectProgress);
          
          setLoading(false);
          return;
        }
        
        if (!supabase) {
          throw new Error("Supabase client not initialized")
        }
        
        // Verify that this student belongs to the logged-in mentor
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select(`
            id,
            study_streak,
            profiles:id(full_name, email)
          `)
          .eq('id', params.id)
          .eq('mentor_id', user.id)
          .single()
        
        if (studentError) {
          throw new Error("Student not found or not assigned to you")
        }
        
        if (!studentData) {
          throw new Error("Student not found")
        }
        
        // Fetch homework data
        const { data: homeworkData, error: homeworkError } = await supabase
          .from('homework')
          .select('id, status, subject, created_at, grade')
          .eq('student_id', params.id)
        
        if (homeworkError) {
          console.error("Error fetching homework:", homeworkError)
        }
        
        const totalHomework = homeworkData?.length || 0
        const completedHomework = homeworkData?.filter(hw => hw.status === 'graded').length || 0
        
        // Fetch session data
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('id, status, subject, scheduled_at')
          .eq('student_id', params.id)
        
        if (sessionError) {
          console.error("Error fetching sessions:", sessionError)
        }
        
        const totalSessions = sessionData?.length || 0
        const attendedSessions = sessionData?.filter(s => s.status === 'completed').length || 0
        
        // Get unique subjects from sessions and homework
        const sessionSubjects = sessionData?.map(s => s.subject) || []
        const homeworkSubjects = homeworkData?.map(h => h.subject) || []
        const uniqueSubjects = [...new Set([...sessionSubjects, ...homeworkSubjects])]
        
        // Create student info object
        setStudent({
          id: params.id,
          fullName: studentData.profiles?.full_name || 'Unknown Student',
          email: studentData.profiles?.email || '',
          studyStreak: studentData.study_streak || 0,
          totalHomework,
          completedHomework,
          totalSessions,
          attendedSessions,
          subjects: uniqueSubjects,
        })
        
        // Prepare chart data for sessions over time
        if (sessionData && sessionData.length > 0) {
          // Group sessions by month
          const sessionsByMonth: Record<string, number> = {}
          
          sessionData.forEach((session: any) => {
            const date = new Date(session.scheduled_at)
            const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`
            
            if (!sessionsByMonth[monthYear]) {
              sessionsByMonth[monthYear] = 0
            }
            
            if (session.status === 'completed') {
              sessionsByMonth[monthYear]++
            }
          })
          
          // Sort months chronologically
          const sortedMonths = Object.keys(sessionsByMonth).sort((a, b) => {
            const dateA = new Date(a)
            const dateB = new Date(b)
            return dateA.getTime() - dateB.getTime()
          })
          
          setSessionData({
            labels: sortedMonths,
            datasets: [
              {
                label: 'Completed Sessions',
                data: sortedMonths.map(month => sessionsByMonth[month]),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
              }
            ]
          })
        }
        
        // Prepare chart data for homework grades
        if (homeworkData && homeworkData.length > 0) {
          // Filter to only graded homework
          const gradedHomework = homeworkData.filter((hw: any) => hw.status === 'graded' && hw.grade !== null)
          
          // Group by subject
          const subjectGrades: Record<string, number[]> = {}
          
          gradedHomework.forEach((hw: any) => {
            if (!subjectGrades[hw.subject]) {
              subjectGrades[hw.subject] = []
            }
            
            subjectGrades[hw.subject].push(hw.grade)
          })
          
          // Calculate average grade per subject
          const subjects = Object.keys(subjectGrades)
          const avgGrades = subjects.map(subject => {
            const grades = subjectGrades[subject]
            const avg = grades.reduce((sum, grade) => sum + grade, 0) / grades.length
            return avg.toFixed(1)
          })
          
          setHomeworkData({
            labels: subjects,
            datasets: [
              {
                label: 'Average Grade',
                data: avgGrades,
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
              }
            ]
          })
          
          // Prepare subject progress
          const progressBySubject = subjects.map(subject => {
            const homeworkInSubject = homeworkData.filter((hw: any) => hw.subject === subject)
            const completedInSubject = homeworkInSubject.filter((hw: any) => hw.status === 'graded').length
            const totalInSubject = homeworkInSubject.length
            const percentComplete = totalInSubject > 0 ? (completedInSubject / totalInSubject) * 100 : 0
            
            // Calculate average grade
            const grades = homeworkInSubject
              .filter((hw: any) => hw.status === 'graded' && hw.grade !== null)
              .map((hw: any) => hw.grade)
            
            const avgGrade = grades.length > 0
              ? grades.reduce((sum: number, grade: number) => sum + grade, 0) / grades.length
              : 0
            
            return {
              subject,
              percentComplete,
              avgGrade,
              completed: completedInSubject,
              total: totalInSubject,
            }
          })
          
          setSubjectProgress(progressBySubject)
        }
        
      } catch (error) {
        console.error("Error fetching student progress:", error)
        setError(error instanceof Error ? error.message : "Failed to load student progress")
        
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load student progress",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchStudentProgress()
  }, [user, params.id, toast])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading student progress data...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <AlertCircle className="h-5 w-5 inline mr-2" />
        {error}
      </div>
    )
  }
  
  if (!student) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Student Not Found</h2>
        <p className="text-gray-600">The student you're looking for doesn't exist or isn't assigned to you.</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Progress</h1>
        <p className="text-gray-600 mt-2">Tracking learning journey and academic improvement</p>
      </div>
      
      {/* Student Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src="" alt={student.fullName} />
              <AvatarFallback className="text-2xl">
                {student.fullName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold">{student.fullName}</h2>
              <p className="text-gray-600">{student.email}</p>
              
              <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                {student.subjects.map((subject, i) => (
                  <Badge key={i} variant="outline" className="bg-blue-50">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{student.studyStreak}</p>
                <p className="text-xs text-gray-600">Day Streak</p>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {student.totalSessions > 0 
                    ? Math.round((student.attendedSessions / student.totalSessions) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-gray-600">Attendance</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="homework">Homework</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" /> Homework Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold">
                    {student.completedHomework}/{student.totalHomework}
                  </div>
                  <p className="text-sm text-gray-600">assignments completed</p>
                </div>
                <Progress 
                  value={student.totalHomework > 0 
                    ? (student.completedHomework / student.totalHomework) * 100 
                    : 0} 
                  className="h-3" 
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" /> Session Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold">
                    {student.attendedSessions}/{student.totalSessions}
                  </div>
                  <p className="text-sm text-gray-600">sessions attended</p>
                </div>
                <Progress 
                  value={student.totalSessions > 0 
                    ? (student.attendedSessions / student.totalSessions) * 100 
                    : 0} 
                  className="h-3" 
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Subject Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Progress by Subject</CardTitle>
              <CardDescription>Homework completion and average grades by subject</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {subjectProgress.length > 0 ? (
                subjectProgress.map((progress, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{progress.subject}</h4>
                        <p className="text-sm text-gray-500">
                          {progress.completed}/{progress.total} assignments completed
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="outline"
                          className={
                            progress.avgGrade >= 90 ? 'bg-green-50 text-green-700' :
                            progress.avgGrade >= 70 ? 'bg-blue-50 text-blue-700' :
                            'bg-yellow-50 text-yellow-700'
                          }
                        >
                          Avg. {progress.avgGrade.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={progress.percentComplete} className="h-2" />
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No subject data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="homework" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Homework Performance</CardTitle>
              <CardDescription>Average grades by subject</CardDescription>
            </CardHeader>
            <CardContent>
              {homeworkData.labels && homeworkData.labels.length > 0 ? (
                <div className="h-80">
                  <Bar 
                    data={homeworkData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          title: {
                            display: true,
                            text: 'Average Grade (%)'
                          }
                        }
                      }
                    }} 
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No graded homework available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sessions" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Attendance</CardTitle>
              <CardDescription>Completed sessions over time</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionData.labels && sessionData.labels.length > 0 ? (
                <div className="h-80">
                  <Line 
                    data={sessionData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Sessions'
                          },
                          ticks: {
                            stepSize: 1
                          }
                        }
                      }
                    }} 
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No session history available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}