"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, BookOpen, CheckCircle, AlertCircle, User } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

interface ProgressReport {
  id: string
  student_id: string
  subject: string
  total_tests: number
  average_score: number
  completed_homework: number
  mentor_feedback?: string
  last_updated: string
  student?: {
    full_name: string
    email: string
  }
}

interface Student {
  id: string
  full_name: string
  email: string
}

export default function ProgressReportsPage() {
  const [progressReports, setProgressReports] = useState<ProgressReport[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    if (selectedStudentId) {
      fetchProgressReports(selectedStudentId)
    }
  }, [selectedStudentId])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      
      if (!supabase) {
        console.error("Supabase client not initialized")
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'student')
        .order('full_name')

      if (error) {
        console.error("Error fetching students:", error)
        toast({
          title: "Error fetching students",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setStudents(data as Student[])
        if (data.length > 0) {
          setSelectedStudentId(data[0].id)
        }
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProgressReports = async (studentId: string) => {
    try {
      setLoading(true)
      
      if (!supabase) {
        console.error("Supabase client not initialized")
        return
      }

      const { data, error } = await supabase
        .from('progress_reports')
        .select(`
          *,
          student:student_id(id, full_name, email)
        `)
        .eq('student_id', studentId)
        .order('subject')

      if (error) {
        console.error("Error fetching progress reports:", error)
        toast({
          title: "Error fetching progress reports",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setProgressReports(data as ProgressReport[])
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date)
    } catch (e) {
      return "Invalid date"
    }
  }

  // Generate demo data if no reports exist
  const generateDemoData = () => {
    if (!selectedStudentId) return
    
    const demoSubjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English"]
    const demoReports = demoSubjects.map(subject => ({
      id: `demo-${subject.toLowerCase()}-${selectedStudentId}`,
      student_id: selectedStudentId,
      subject,
      total_tests: Math.floor(Math.random() * 10) + 5,
      average_score: Math.floor(Math.random() * 30) + 60,
      completed_homework: Math.floor(Math.random() * 15) + 5,
      mentor_feedback: "Student is making good progress in this subject.",
      last_updated: new Date().toISOString(),
      student: students.find(s => s.id === selectedStudentId)
    }))
    
    setProgressReports(demoReports as ProgressReport[])
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Progress Reports</h1>
          <p className="text-gray-500">View detailed student progress reports</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Student</CardTitle>
          <CardDescription>Choose a student to view their progress reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
                disabled={loading || students.length === 0}
              >
                <SelectTrigger>
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => fetchProgressReports(selectedStudentId)} disabled={!selectedStudentId}>
              Refresh Data
            </Button>
            <Button variant="outline" onClick={generateDemoData} disabled={!selectedStudentId}>
              Generate Demo Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading progress reports...</p>
        </div>
      ) : progressReports.length === 0 ? (
        <div className="text-center py-10">
          <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">No progress reports found</h3>
          <p className="text-gray-500">
            {selectedStudentId 
              ? "This student doesn't have any progress reports yet" 
              : "Please select a student to view their progress reports"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Subject Performance</CardTitle>
              <CardDescription>
                Performance across different subjects for {progressReports[0]?.student?.full_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {progressReports.map((report) => (
                  <div key={report.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{report.subject}</span>
                      <span className={getScoreColor(report.average_score)}>
                        {report.average_score}%
                      </span>
                    </div>
                    <Progress 
                      value={report.average_score} 
                      className={getProgressColor(report.average_score)} 
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{report.total_tests} tests taken</span>
                      <span>Last updated: {formatDate(report.last_updated)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Homework Completion</CardTitle>
              <CardDescription>
                Homework completion status for {progressReports[0]?.student?.full_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {progressReports.map((report) => (
                  <div key={`hw-${report.id}`} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{report.subject}</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {report.completed_homework} completed
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        {report.completed_homework} homework assignments completed
                      </span>
                    </div>
                    {report.mentor_feedback && (
                      <div className="flex items-start gap-2 mt-2 p-2 bg-gray-50 rounded-md">
                        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                        <div className="text-sm">
                          <span className="font-medium">Mentor feedback:</span>
                          <p className="text-gray-600">{report.mentor_feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Overall performance trends for {progressReports[0]?.student?.full_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="text-center p-4 border rounded-md">
                    <div className="text-3xl font-bold text-blue-600">
                      {Math.round(
                        progressReports.reduce((sum, report) => sum + report.average_score, 0) / progressReports.length
                      )}%
                    </div>
                    <p className="text-sm text-gray-500">Average Score Across All Subjects</p>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="text-center p-4 border rounded-md">
                    <div className="text-3xl font-bold text-green-600">
                      {progressReports.reduce((sum, report) => sum + report.completed_homework, 0)}
                    </div>
                    <p className="text-sm text-gray-500">Total Homework Completed</p>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="text-center p-4 border rounded-md">
                    <div className="text-3xl font-bold text-purple-600">
                      {progressReports.reduce((sum, report) => sum + report.total_tests, 0)}
                    </div>
                    <p className="text-sm text-gray-500">Total Tests Taken</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="font-medium mb-2">Recommendations</h3>
                <ul className="space-y-2">
                  {progressReports
                    .filter(report => report.average_score < 70)
                    .map(report => (
                      <li key={`rec-${report.id}`} className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <span className="text-sm">
                          Consider additional support for <strong>{report.subject}</strong> (current score: {report.average_score}%)
                        </span>
                      </li>
                    ))}
                  {progressReports.filter(report => report.average_score < 70).length === 0 && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span className="text-sm">
                        Student is performing well across all subjects!
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}