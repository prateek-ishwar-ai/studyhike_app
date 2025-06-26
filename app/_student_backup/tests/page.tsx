"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, TrendingUp, Plus } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface Test {
  id: number
  testName: string
  subject: string
  score: number
  maxScore: number
  testDate: string
  percentile?: number
  feedback?: string
}

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  const [newTest, setNewTest] = useState({
    testName: "",
    subject: "Physics",
    score: "",
    maxScore: "100",
    testDate: new Date().toISOString().split('T')[0],
  })

  // Fetch tests data
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

        // Get test scores
        const { data: testData, error: testError } = await supabase
          .from('tests')
          .select('*')
          .eq('student_id', user.id)
          .order('test_date', { ascending: false })
        
        if (testError) {
          console.error("Tests error:", testError)
        } else if (testData) {
          // Transform the data
          const formattedTests = testData.map(test => ({
            id: test.id,
            testName: test.test_name,
            subject: test.subject,
            score: test.score,
            maxScore: test.max_score,
            testDate: test.test_date,
            percentile: test.percentile || undefined,
            feedback: test.mentor_feedback || undefined
          }))
          
          setTests(formattedTests)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleAddTest = async () => {
    if (!newTest.testName || !newTest.score || !newTest.testDate || !supabase || !userId) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    const score = parseInt(newTest.score)
    const maxScore = parseInt(newTest.maxScore)

    if (isNaN(score) || isNaN(maxScore) || score < 0 || maxScore <= 0 || score > maxScore) {
      toast({
        title: "Invalid scores",
        description: "Please enter valid score values. Score should be between 0 and max score.",
        variant: "destructive"
      })
      return
    }

    setSubmitLoading(true)

    try {
      // Insert into database
      const { data, error } = await supabase
        .from('tests')
        .insert({
          student_id: userId,
          test_name: newTest.testName,
          subject: newTest.subject,
          score: score,
          max_score: maxScore,
          test_date: newTest.testDate
        })
        .select('id')
        .single()

      if (error) {
        throw error
      }

      // Add to local state with the returned ID
      const test: Test = {
        id: data.id,
        testName: newTest.testName,
        subject: newTest.subject,
        score: score,
        maxScore: maxScore,
        testDate: newTest.testDate,
        // Percentile will be calculated by the mentor later
      }

      setTests((prev) => [test, ...prev])

      // Reset form
      setNewTest({
        testName: "",
        subject: "Physics",
        score: "",
        maxScore: "100",
        testDate: new Date().toISOString().split('T')[0],
      })

      toast({
        title: "Success",
        description: "Test score added successfully!"
      })
    } catch (error) {
      console.error("Error adding test:", error)
      toast({
        title: "Error",
        description: "Failed to add test score. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitLoading(false)
    }
  }

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case "Physics":
        return "bg-blue-100 text-blue-800"
      case "Chemistry":
        return "bg-green-100 text-green-800"
      case "Mathematics":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600"
    if (percentage >= 75) return "text-blue-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const averageScore =
    tests.length > 0 ? tests.reduce((sum, test) => sum + (test.score / test.maxScore) * 100, 0) / tests.length : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading test data...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Scores</h1>
          <p className="text-gray-600 mt-1">Track your test performance and progress</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Test Score
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Test Score</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="testName">Test Name</Label>
                <Input
                  id="testName"
                  value={newTest.testName}
                  onChange={(e) => setNewTest({ ...newTest, testName: e.target.value })}
                  placeholder="e.g., JEE Main Mock Test 1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={newTest.subject} onValueChange={(value) => setNewTest({ ...newTest, subject: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Biology">Biology</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="testDate">Test Date</Label>
                  <Input
                    id="testDate"
                    type="date"
                    value={newTest.testDate}
                    onChange={(e) => setNewTest({ ...newTest, testDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="score">Score Obtained</Label>
                  <Input
                    id="score"
                    type="number"
                    value={newTest.score}
                    onChange={(e) => setNewTest({ ...newTest, score: e.target.value })}
                    placeholder="85"
                  />
                </div>
                <div>
                  <Label htmlFor="maxScore">Maximum Score</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    value={newTest.maxScore}
                    onChange={(e) => setNewTest({ ...newTest, maxScore: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>

              <Button className="w-full" onClick={handleAddTest} disabled={submitLoading}>
                {submitLoading ? "Adding..." : "Add Test Score"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tests.length}</div>
            <p className="text-xs text-muted-foreground">Tests recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>{averageScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tests.length > 0 ? Math.max(...tests.map((t) => (t.score / t.maxScore) * 100)).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Personal best</p>
          </CardContent>
        </Card>
      </div>

      {/* Test List */}
      <Card>
        <CardHeader>
          <CardTitle>All Test Scores</CardTitle>
          <CardDescription>Your complete test performance history</CardDescription>
        </CardHeader>
        <CardContent>
          {tests.length > 0 ? (
            <div className="space-y-4">
              {tests.map((test) => {
                const percentage = (test.score / test.maxScore) * 100
                return (
                  <div key={test.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Badge className={getSubjectColor(test.subject)}>{test.subject}</Badge>
                        <h3 className="font-medium">{test.testName}</h3>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getScoreColor(percentage)}`}>
                          {test.score}/{test.maxScore}
                        </div>
                        <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Date: {new Date(test.testDate).toLocaleDateString()}</span>
                      {test.percentile && <span>Percentile: {test.percentile.toFixed(1)}</span>}
                    </div>
                    {test.feedback && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                        <strong>Feedback:</strong> {test.feedback}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No test scores recorded yet</p>
              <p className="text-sm text-gray-500 mt-1">Add your first test score to start tracking progress</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
