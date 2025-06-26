"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, User, Clock, Loader } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface Question {
  id: number
  subject: string
  question: string
  mentorResponse?: string
  status: "pending" | "answered"
  askedAt: string
  answeredAt?: string
  mentorName?: string
  mentorId?: string
}

export default function AskMentorPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  const [newQuestion, setNewQuestion] = useState({
    subject: "Physics",
    question: "",
  })

  // Fetch questions from Supabase
  useEffect(() => {
    async function fetchQuestions() {
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

        // Get questions - just fetch basic data first
        const { data, error } = await supabase
          .from('mentor_questions')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error("Error fetching questions:", error)
          toast({
            title: "Error",
            description: "Failed to load your questions. Please try again later.",
            variant: "destructive"
          })
        } else if (data) {
          const formattedQuestions = data.map(question => ({
            id: question.id,
            subject: question.subject,
            question: question.question_text,
            mentorResponse: question.mentor_response || undefined,
            status: question.is_answered ? "answered" : "pending",
            askedAt: question.created_at,
            answeredAt: question.answered_at || undefined,
            mentorName: "Mentor", // Default name since we're not joining with profiles
            mentorId: question.mentor_id || undefined
          }))
          
          setQuestions(formattedQuestions)
        }
      } catch (error) {
        console.error("Error in fetch questions:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newQuestion.question.trim() || !userId || !supabase) {
      toast({
        title: "Missing information",
        description: "Please enter your question",
        variant: "destructive"
      })
      return
    }

    setSubmitLoading(true)

    try {
      // Insert into database
      const { data, error } = await supabase
        .from('mentor_questions')
        .insert({
          student_id: userId,
          subject: newQuestion.subject,
          question_text: newQuestion.question.trim(),
          is_answered: false
        })
        .select('id, created_at')
        .single()

      if (error) {
        throw error
      }

      // Add to local state
      const question: Question = {
        id: data.id,
        subject: newQuestion.subject,
        question: newQuestion.question.trim(),
        status: "pending",
        askedAt: data.created_at,
      }

      setQuestions((prev) => [question, ...prev])

      // Reset form
      setNewQuestion({
        subject: "Physics",
        question: "",
      })

      toast({
        title: "Question submitted",
        description: "Your question has been submitted. A mentor will respond soon.",
      })
    } catch (error) {
      console.error("Error submitting question:", error)
      toast({
        title: "Error",
        description: "Failed to submit question. Please try again.",
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

  const getStatusBadge = (status: string) => {
    if (status === "answered") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Answered
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
        Pending
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const pendingQuestions = questions.filter((q) => q.status === "pending")
  const answeredQuestions = questions.filter((q) => q.status === "answered")
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin mb-4" />
        <p>Loading your questions...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ask Your Mentor</h1>
        <p className="text-gray-600 mt-1">Get help with your doubts and questions</p>
      </div>

      {/* Ask New Question */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Ask a New Question
          </CardTitle>
          <CardDescription>Your mentor will respond within 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={newQuestion.subject}
                onValueChange={(value) => setNewQuestion({ ...newQuestion, subject: value })}
              >
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
              <Label htmlFor="question">Your Question</Label>
              <Textarea
                id="question"
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                placeholder="Describe your doubt or question in detail..."
                rows={4}
                required
              />
            </div>

            <Button type="submit" disabled={submitLoading}>
              {submitLoading ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Question
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
            <p className="text-xs text-muted-foreground">Questions asked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingQuestions.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Answered</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{answeredQuestions.length}</div>
            <p className="text-xs text-muted-foreground">Questions resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {/* Pending Questions */}
        {pendingQuestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-yellow-700">Pending Questions ({pendingQuestions.length})</CardTitle>
              <CardDescription>Questions waiting for mentor response</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingQuestions.map((question) => (
                <div key={question.id} className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getSubjectColor(question.subject)}>{question.subject}</Badge>
                      {getStatusBadge(question.status)}
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(question.askedAt)}</span>
                  </div>
                  <p className="text-gray-700">{question.question}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Answered Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-green-700">Answered Questions ({answeredQuestions.length})</CardTitle>
            <CardDescription>Questions with mentor responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {answeredQuestions.length > 0 ? (
              answeredQuestions.map((question) => (
                <div key={question.id} className="p-4 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getSubjectColor(question.subject)}>{question.subject}</Badge>
                      {getStatusBadge(question.status)}
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(question.askedAt)}</span>
                  </div>

                  <div className="mb-4">
                    <p className="font-medium text-gray-900 mb-1">Your Question:</p>
                    <p className="text-gray-700">{question.question}</p>
                  </div>

                  {question.mentorResponse && (
                    <div className="bg-white p-4 rounded-md border">
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-700">{question.mentorName}</span>
                        {question.answeredAt && (
                          <span className="text-sm text-gray-500">• {formatDate(question.answeredAt)}</span>
                        )}
                      </div>
                      <p className="text-gray-700">{question.mentorResponse}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No answered questions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
