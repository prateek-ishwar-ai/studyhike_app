"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { 
  BookOpen, 
  Search, 
  Clock, 
  CheckCircle, 
  Star, 
  Eye, 
  Download, 
  Upload, 
  X, 
  FileText,
  Calendar,
  User,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Lightbulb,
  MessageSquare,
  Timer
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { ImgBBUploader } from "@/components/imgbb-uploader"

interface Homework {
  id: string
  title: string
  subject: string
  student_id: string
  student_name: string
  status: "pending" | "submitted" | "reviewed" | "needs_rework"
  due_date: string
  submitted_at?: string
  score?: number
  feedback?: string
  created_at: string
  submission_file_url?: string
  student_comments?: string
  feedback_file_url?: string
  order_of_attempt?: string[]
  hints?: Record<string, string>
  time_to_spend?: string
  deadline?: string
  is_urgent?: boolean
  is_test_linked?: boolean
}

interface HomeworkSubmission {
  id: string
  student_id: string
  title: string
  subject: string
  description?: string
  file_path?: string
  status: "submitted" | "reviewed" | "needs_rework"
  submitted_at: string
  student_comments?: string
  feedback?: string
  feedback_file_path?: string
  order_of_attempt?: string
  hints?: string
  time_to_spend?: string
  deadline?: string
  is_urgent?: boolean
  is_test_linked?: boolean
}

const subjects = ["Physics", "Mathematics", "Chemistry", "Biology", "English", "History", "Geography", "Computer Science"]

export default function MentorHomeworkPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [homework, setHomework] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("submitted")
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null)
  const [reviewData, setReviewData] = useState({
    score: "",
    feedback: "",
  })
  
  const supabase = getSupabaseClient()
  
  // New state for enhanced homework review
  const [feedbackFile, setFeedbackFile] = useState<File | null>(null)
  const [timeToSpend, setTimeToSpend] = useState("30")
  const [deadline, setDeadline] = useState("")
  const [isUrgent, setIsUrgent] = useState(false)
  const [isTestLinked, setIsTestLinked] = useState(false)
  const [questions, setQuestions] = useState<string[]>([])
  const [hints, setHints] = useState<Record<string, string>>({})
  const [newQuestion, setNewQuestion] = useState("")
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [feedback, setFeedback] = useState("")
  
  // New state for creating homework
  const [newHomework, setNewHomework] = useState({
    student_id: "",
    subject: "Physics",
    title: "",
    description: "",
    deadline: ""
  })
  const [students, setStudents] = useState<{id: string, name: string}[]>([])
  const [creatingHomework, setCreatingHomework] = useState(false)
  
  // AI assistance state
  const [showAIHelp, setShowAIHelp] = useState(false)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [loadingAI, setLoadingAI] = useState(false)
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive"
      })
      return
    }
    
    // Check file type
    const fileType = file.type
    if (!fileType.startsWith('image/') && fileType !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Only images and PDFs are allowed",
        variant: "destructive"
      })
      return
    }
    
    try {
      setSubmittingFeedback(true)
      
      // Create form data
      const formData = new FormData()
      formData.append('image', file)
      formData.append('key', '56e6b93d96288feb9baa20dd66cbed38') // ImageBB API key
      
      // Upload to ImageBB
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Store the URL directly
        setSelectedHomework({
          ...selectedHomework!,
          feedback_file_url: data.data.url
        })
        
        toast({
          title: "File uploaded",
          description: "Your feedback file has been uploaded successfully",
          variant: "default"
        })
      } else {
        throw new Error(data.error?.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your file. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmittingFeedback(false)
    }
  }

  useEffect(() => {
    if (user && profile?.role === 'mentor') {
      fetchHomework()
      fetchStudents()
    }
  }, [user, profile])

  const fetchHomework = async () => {
    if (!supabase || !user) {
      setLoading(false)
      return
    }

    try {
      // Get homework from the homework table
      const { data: homeworkData, error: homeworkError } = await supabase
        .from("homework")
        .select(`
          *,
          student:student_id(full_name)
        `)
        .eq("mentor_id", user.id)
        .order("created_at", { ascending: false })

      if (homeworkError) {
        console.error("Error fetching homework:", homeworkError)
      }

      // Format the data
      const formattedHomeworkData = homeworkData?.map((item) => ({
        id: item.id,
        title: item.title,
        subject: item.subject,
        student_id: item.student_id,
        student_name: item.student?.full_name || "Unknown Student",
        status: item.status,
        due_date: item.due_date,
        submitted_at: item.submitted_at,
        score: item.score,
        feedback: item.feedback,
        created_at: item.created_at,
        submission_file_url: item.submission_file_url,
        student_comments: item.submission_notes,
        feedback_file_url: null,
        order_of_attempt: [],
        hints: {},
        time_to_spend: null,
        deadline: item.due_date,
        is_urgent: false,
        is_test_linked: false
      })) || []
      
      setHomework(formattedHomeworkData)
    } catch (error) {
      console.error("Error in fetchHomework:", error)
      toast({
        title: "Error",
        description: "Failed to load homework data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    if (!supabase || !user) return

    try {
      console.log("Fetching assigned students for mentor:", user.id);
      
      // First try the assigned_students table
      const { data: assignedStudents, error: studentsError } = await supabase
        .from('assigned_students')
        .select(`
          student_id,
          profiles:student_id(full_name)
        `)
        .eq('mentor_id', user.id);
      
      // If there's data in the assigned_students table, use it
      if (!studentsError && assignedStudents && assignedStudents.length > 0) {
        console.log("Found students in assigned_students table:", assignedStudents.length);
        
        const formattedStudents = assignedStudents.map(item => ({
          id: item.student_id,
          name: item.profiles?.full_name || 'Unknown Student'
        }));
        
        setStudents(formattedStudents);
        return;
      }
      
      // If no data in assigned_students or there was an error, try the student_mentor_assignments table
      console.log("Trying student_mentor_assignments table as fallback");
      
      const { data: oldAssignments, error: oldError } = await supabase
        .from('student_mentor_assignments')
        .select(`
          student_id,
          profiles:student_id(full_name)
        `)
        .eq('mentor_id', user.id);
      
      if (oldError) {
        console.error("Error fetching from student_mentor_assignments:", oldError);
        throw oldError;
      }
      
      if (oldAssignments && oldAssignments.length > 0) {
        console.log("Found students in student_mentor_assignments table:", oldAssignments.length);
        
        const formattedStudents = oldAssignments.map(item => ({
          id: item.student_id,
          name: item.profiles?.full_name || 'Unknown Student'
        }));
        
        setStudents(formattedStudents);
      } else {
        console.log("No assigned students found in either table");
        setStudents([]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  }

  // This function is already defined above

  const handleAddQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions([...questions, newQuestion.trim()])
      setHints({...hints, [newQuestion.trim()]: ""})
      setNewQuestion("")
    }
  }

  const handleUpdateHint = (question: string, hint: string) => {
    setHints({...hints, [question]: hint})
  }

  const handleRemoveQuestion = (index: number) => {
    const questionToRemove = questions[index]
    const newQuestions = questions.filter((_, i) => i !== index)
    const newHints = {...hints}
    delete newHints[questionToRemove]
    
    setQuestions(newQuestions)
    setHints(newHints)
  }

  const moveQuestionUp = (index: number) => {
    if (index === 0) return // Already at the top
    
    const items = Array.from(questions)
    const temp = items[index]
    items[index] = items[index - 1]
    items[index - 1] = temp
    
    setQuestions(items)
  }
  
  const moveQuestionDown = (index: number) => {
    if (index === questions.length - 1) return // Already at the bottom
    
    const items = Array.from(questions)
    const temp = items[index]
    items[index] = items[index + 1]
    items[index + 1] = temp
    
    setQuestions(items)
  }

  const handleSubmitFeedback = async () => {
    if (!selectedHomework || !supabase || !user) return

    setSubmittingFeedback(true)

    try {
      // The feedback file URL is already set in selectedHomework.feedback_file_url
      // when the file is uploaded via handleFileChange

      // Update regular homework entry
      const { error } = await supabase
        .from('homework')
        .update({
          status: 'reviewed',
          score: Number(reviewData.score),
          feedback: reviewData.feedback || feedback,
          reviewed_at: new Date().toISOString(),
          feedback_file_url: feedbackFilePath,
          // Store the additional data as JSON in a new column
          mentor_feedback_data: JSON.stringify({
            order_of_attempt: questions,
            hints: hints,
            time_to_spend: timeToSpend,
            is_urgent: isUrgent,
            is_test_linked: isTestLinked
          })
        })
        .eq('id', selectedHomework.id)

      if (error) throw error

      // Add to student's study plan if deadline is set
      if (deadline) {
        try {
          const deadlineDate = new Date(deadline)
          const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][deadlineDate.getDay()]
          
          await supabase
            .from('study_plans')
            .insert({
              student_id: selectedHomework.student_id,
              subject: selectedHomework.subject,
              topic: `Homework: ${selectedHomework.title}`,
              day_of_week: dayOfWeek,
              duration_hours: parseFloat(timeToSpend) / 60,
              is_completed: false,
              added_by: 'mentor',
              authenticity: 'mentor-assigned',
              mentor_notes: `Complete the homework by ${new Date(deadline).toLocaleDateString()}`,
              week_start: new Date().toISOString().split('T')[0]
            })
        } catch (studyPlanError) {
          console.error("Error adding to study plan:", studyPlanError)
          // Continue anyway as the feedback was saved
        }
      }

      // Refresh submissions
      await fetchHomework()

      // Reset form
      setSelectedHomework(null)
      setReviewData({ score: "", feedback: "" })
      setFeedback("")
      setFeedbackFile(null)
      setQuestions([])
      setHints({})
      setTimeToSpend("30")
      setDeadline("")
      setIsUrgent(false)
      setIsTestLinked(false)

      toast({
        title: "Success",
        description: "Feedback submitted successfully"
      })
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const handleCreateHomework = async () => {
    if (!supabase || !user) return
    
    if (!newHomework.student_id || !newHomework.subject || !newHomework.title) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setCreatingHomework(true)

    try {
      // Insert new homework
      const { error } = await supabase
        .from('homework')
        .insert({
          student_id: newHomework.student_id,
          mentor_id: user.id,
          subject: newHomework.subject,
          title: newHomework.title,
          description: newHomework.description || null,
          status: 'pending',
          due_date: newHomework.deadline || null
        })

      if (error) throw error

      // Reset form
      setNewHomework({
        student_id: "",
        subject: "Physics",
        title: "",
        description: "",
        deadline: ""
      })

      // Refresh homework list
      await fetchHomework()

      toast({
        title: "Success",
        description: "Homework assigned successfully"
      })
    } catch (error) {
      console.error("Error creating homework:", error)
      toast({
        title: "Error",
        description: "Failed to assign homework. Please try again.",
        variant: "destructive"
      })
    } finally {
      setCreatingHomework(false)
    }
  }

  const handleGenerateAIFeedback = async () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a description of the homework questions",
        variant: "destructive"
      })
      return
    }

    setLoadingAI(true)

    try {
      // This is a mock implementation - in a real app, you would call your OpenAI API endpoint
      // For now, we'll simulate a response
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Generate a mock response based on the prompt
      const mockResponse = {
        order: ["Question 2", "Question 1", "Question 3"],
        hints: {
          "Question 1": "Start by drawing a free body diagram and identifying all forces.",
          "Question 2": "Use the conservation of energy principle to solve this problem.",
          "Question 3": "Remember to convert units to SI before calculating."
        },
        time: "45 minutes"
      }
      
      // Update the form with AI suggestions
      setQuestions(mockResponse.order)
      setHints(mockResponse.hints)
      setTimeToSpend(mockResponse.time.split(" ")[0])
      
      setAiResponse(JSON.stringify(mockResponse, null, 2))
      
      toast({
        title: "AI Suggestions Generated",
        description: "The form has been updated with AI recommendations"
      })
    } catch (error) {
      console.error("Error generating AI feedback:", error)
      toast({
        title: "Error",
        description: "Failed to generate AI suggestions. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoadingAI(false)
    }
  }

  const filteredHomework = homework.filter((hw) => {
    const matchesSearch =
      hw.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hw.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hw.subject.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab = activeTab === "all" || hw.status === activeTab
    return matchesSearch && matchesTab
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "submitted":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Eye className="h-3 w-3 mr-1" />
            Needs Review
          </Badge>
        )
      case "reviewed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Reviewed
          </Badge>
        )
      case "needs_rework":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Needs Rework
          </Badge>
        )
      default:
        return null
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
      case "Biology":
        return "bg-red-100 text-red-800"
      case "English":
        return "bg-yellow-100 text-yellow-800"
      case "History":
        return "bg-orange-100 text-orange-800"
      case "Geography":
        return "bg-teal-100 text-teal-800"
      case "Computer Science":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const stats = {
    total: homework.length,
    pending: homework.filter((hw) => hw.status === "pending").length,
    submitted: homework.filter((hw) => hw.status === "submitted").length,
    reviewed: homework.filter((hw) => hw.status === "reviewed").length,
    needsRework: homework.filter((hw) => hw.status === "needs_rework").length,
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading homework...</div>
      </div>
    )
  }

  if (profile?.role !== 'mentor') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Access denied. Only mentors can view this page.</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Homework Management</h1>
          <p className="text-gray-600 mt-1">Review student submissions and provide feedback</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Assign New Homework</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign New Homework</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="student">Student</Label>
                <Select 
                  value={newHomework.student_id} 
                  onValueChange={(value) => setNewHomework({...newHomework, student_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={newHomework.subject} 
                  onValueChange={(value) => setNewHomework({...newHomework, subject: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newHomework.title}
                  onChange={(e) => setNewHomework({...newHomework, title: e.target.value})}
                  placeholder="e.g., Chapter 5 Problems"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newHomework.description}
                  onChange={(e) => setNewHomework({...newHomework, description: e.target.value})}
                  placeholder="Provide details about the homework assignment"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deadline">Due Date (Optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newHomework.deadline}
                  onChange={(e) => setNewHomework({...newHomework, deadline: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateHomework} disabled={creatingHomework}>
                {creatingHomework ? "Assigning..." : "Assign Homework"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Homework</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.reviewed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Rework</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.needsRework}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Homework</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search homework by title, student, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Homework Table */}
      <Card>
        <CardHeader>
          <CardTitle>Homework Submissions</CardTitle>
          <CardDescription>Review and grade student homework</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="submitted">Needs Review ({stats.submitted})</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed ({stats.reviewed})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="needs_rework">Needs Rework ({stats.needsRework})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredHomework.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHomework.map((hw) => (
                      <TableRow key={hw.id}>
                        <TableCell>
                          <div className="font-medium">{hw.title}</div>
                        </TableCell>
                        <TableCell>{hw.student_name}</TableCell>
                        <TableCell>
                          <Badge className={getSubjectColor(hw.subject)}>{hw.subject}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(hw.status)}</TableCell>
                        <TableCell>{formatDate(hw.due_date)}</TableCell>
                        <TableCell>
                          {hw.score ? (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-500 mr-1" />
                              {hw.score}/100
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {hw.submission_file_url && (
                              <div className="flex items-center space-x-2">
                                {hw.submission_file_url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                  <div className="relative group">
                                    <Button variant="outline" size="sm" asChild>
                                      <a href={hw.submission_file_url} target="_blank" rel="noopener noreferrer">
                                        <img 
                                          src={hw.submission_file_url} 
                                          alt="Preview" 
                                          className="h-6 w-6 object-cover rounded"
                                        />
                                      </a>
                                    </Button>
                                    <div className="absolute hidden group-hover:block z-50 bottom-full left-0 mb-2 p-1 bg-white rounded-md shadow-lg">
                                      <img 
                                        src={hw.submission_file_url} 
                                        alt="Preview" 
                                        className="w-48 h-auto object-contain rounded"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={hw.submission_file_url} target="_blank" rel="noopener noreferrer">
                                      <FileText className="h-4 w-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            )}
                            
                            {(hw.status === "submitted" || hw.status === "needs_rework") && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" onClick={() => {
                                    setSelectedHomework(hw)
                                    setReviewData({
                                      score: hw.score?.toString() || "",
                                      feedback: hw.feedback || ""
                                    })
                                    setFeedback(hw.feedback || "")
                                    setQuestions(hw.order_of_attempt || [])
                                    setHints(hw.hints || {})
                                    setTimeToSpend(hw.time_to_spend || "30")
                                    setDeadline(hw.deadline || "")
                                    setIsUrgent(hw.is_urgent || false)
                                    setIsTestLinked(hw.is_test_linked || false)
                                  }}>
                                    Review
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Review Homework</DialogTitle>
                                  </DialogHeader>
                                  {selectedHomework && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      {/* Left column - Submission details */}
                                      <div className="space-y-4">
                                        <div>
                                          <h3 className="text-lg font-medium">Submission Details</h3>
                                          <div className="mt-2 p-4 border rounded-md space-y-2">
                                            <div className="flex items-center space-x-2">
                                              <Badge className={getSubjectColor(selectedHomework.subject)}>
                                                {selectedHomework.subject}
                                              </Badge>
                                              {getStatusBadge(selectedHomework.status)}
                                            </div>
                                            <h4 className="font-medium">{selectedHomework.title}</h4>
                                            <div className="text-sm text-gray-500">
                                              <div className="flex items-center">
                                                <User className="h-4 w-4 mr-1" />
                                                <span>{selectedHomework.student_name}</span>
                                              </div>
                                              {selectedHomework.submitted_at && (
                                                <div className="flex items-center mt-1">
                                                  <Clock className="h-4 w-4 mr-1" />
                                                  <span>Submitted: {formatDate(selectedHomework.submitted_at)}</span>
                                                </div>
                                              )}
                                            </div>
                                            {selectedHomework.student_comments && (
                                              <div className="mt-2 p-2 bg-gray-50 rounded-md">
                                                <p className="text-sm font-medium">Student Comments:</p>
                                                <p className="text-sm text-gray-600">{selectedHomework.student_comments}</p>
                                              </div>
                                            )}
                                            {selectedHomework.submission_file_url && (
                                              <div className="mt-4 space-y-4">
                                                {/* Display image directly if it's an image URL */}
                                                {selectedHomework.submission_file_url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                                  <div className="border rounded-md overflow-hidden">
                                                    <img 
                                                      src={selectedHomework.submission_file_url} 
                                                      alt="Homework submission" 
                                                      className="w-full h-auto max-h-[500px] object-contain"
                                                    />
                                                  </div>
                                                ) : null}
                                                
                                                <Button variant="outline" size="sm" className="w-full" asChild>
                                                  <a href={selectedHomework.submission_file_url} target="_blank" rel="noopener noreferrer">
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    {selectedHomework.submission_file_url.match(/\.(jpeg|jpg|gif|png)$/i) 
                                                      ? "Open Image in New Tab" 
                                                      : "View Submission File"}
                                                  </a>
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <h3 className="text-lg font-medium">Your Feedback</h3>
                                          <div className="mt-2 space-y-3">
                                            <div className="space-y-2">
                                              <Label htmlFor="score">Score (out of 100)</Label>
                                              <Input
                                                id="score"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={reviewData.score}
                                                onChange={(e) => setReviewData({ ...reviewData, score: e.target.value })}
                                                placeholder="Enter score"
                                              />
                                            </div>
                                            
                                            <div className="space-y-2">
                                              <Label htmlFor="feedback">Feedback Comments</Label>
                                              <Textarea
                                                id="feedback"
                                                value={reviewData.feedback}
                                                onChange={(e) => {
                                                  setReviewData({ ...reviewData, feedback: e.target.value })
                                                  setFeedback(e.target.value)
                                                }}
                                                placeholder="Provide detailed feedback on the submission..."
                                                rows={5}
                                              />
                                            </div>
                                            
                                            <div className="space-y-2">
                                              <Label htmlFor="feedbackFile">Attach Feedback File (Optional)</Label>
                                              <div className="border-2 border-dashed rounded-md p-4 text-center">
                                                <Input
                                                  id="feedbackFile"
                                                  type="file"
                                                  className="hidden"
                                                  onChange={handleFileChange}
                                                  accept=".pdf,.jpg,.jpeg,.png"
                                                />
                                                <Label htmlFor="feedbackFile" className="cursor-pointer">
                                                  {feedbackFile ? (
                                                    <div className="flex items-center justify-center space-x-2">
                                                      <FileText className="h-5 w-5 text-blue-500" />
                                                      <span className="text-sm">{feedbackFile.name}</span>
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={(e) => {
                                                          e.preventDefault()
                                                          setFeedbackFile(null)
                                                        }}
                                                      >
                                                        <X className="h-4 w-4" />
                                                      </Button>
                                                    </div>
                                                  ) : (
                                                    <div className="flex flex-col items-center justify-center">
                                                      <Upload className="h-10 w-10 text-gray-400 mb-2" />
                                                      <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                                                      <p className="text-xs text-gray-400">PDF, JPG, PNG (max. 10MB)</p>
                                                    </div>
                                                  )}
                                                </Label>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Right column - Question ordering and hints */}
                                      <div className="space-y-4">
                                        <div>
                                          <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-medium">Question Order & Hints</h3>
                                            <Button 
                                              variant="outline" 
                                              size="sm"
                                              onClick={() => setShowAIHelp(!showAIHelp)}
                                            >
                                              <Lightbulb className="h-4 w-4 mr-2" />
                                              AI Help
                                            </Button>
                                          </div>
                                          
                                          {showAIHelp && (
                                            <div className="mt-2 p-3 border rounded-md bg-blue-50">
                                              <h4 className="font-medium text-sm mb-2">Generate AI Suggestions</h4>
                                              <div className="space-y-2">
                                                <Textarea
                                                  value={aiPrompt}
                                                  onChange={(e) => setAiPrompt(e.target.value)}
                                                  placeholder="Describe the homework questions here..."
                                                  rows={3}
                                                  className="text-sm"
                                                />
                                                <Button 
                                                  size="sm" 
                                                  className="w-full"
                                                  onClick={handleGenerateAIFeedback}
                                                  disabled={loadingAI}
                                                >
                                                  {loadingAI ? "Generating..." : "Generate Suggestions"}
                                                </Button>
                                                {aiResponse && (
                                                  <div className="mt-2 p-2 bg-white rounded-md text-xs font-mono overflow-x-auto">
                                                    <pre>{aiResponse}</pre>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                          
                                          <div className="mt-2 space-y-3">
                                            <div className="flex space-x-2">
                                              <Input
                                                value={newQuestion}
                                                onChange={(e) => setNewQuestion(e.target.value)}
                                                placeholder="Add a question..."
                                                className="flex-1"
                                              />
                                              <Button type="button" onClick={handleAddQuestion}>Add</Button>
                                            </div>
                                            
                                            <div className="border rounded-md p-2">
                                              <p className="text-sm font-medium mb-2">Question Order (Use arrows to reorder)</p>
                                              {questions.length > 0 ? (
                                                <div className="space-y-2">
                                                  {questions.map((question, index) => (
                                                    <div
                                                      key={index}
                                                      className="flex items-start space-x-2 p-2 bg-gray-50 rounded-md"
                                                    >
                                                      <div className="flex-shrink-0 pt-1">
                                                        <div className="flex flex-col items-center">
                                                          <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-5 w-5 p-0"
                                                            onClick={() => moveQuestionUp(index)}
                                                            disabled={index === 0}
                                                          >
                                                            <ArrowUp className="h-3 w-3 text-gray-400" />
                                                          </Button>
                                                          <span className="text-xs font-medium">{index + 1}</span>
                                                          <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-5 w-5 p-0"
                                                            onClick={() => moveQuestionDown(index)}
                                                            disabled={index === questions.length - 1}
                                                          >
                                                            <ArrowDown className="h-3 w-3 text-gray-400" />
                                                          </Button>
                                                        </div>
                                                      </div>
                                                      <div className="flex-1 space-y-1">
                                                        <p className="text-sm">{question}</p>
                                                        <Textarea
                                                          value={hints[question] || ""}
                                                          onChange={(e) => handleUpdateHint(question, e.target.value)}
                                                          placeholder="Add a hint for this question..."
                                                          className="text-xs"
                                                          rows={2}
                                                        />
                                                      </div>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => handleRemoveQuestion(index)}
                                                      >
                                                        <X className="h-4 w-4" />
                                                      </Button>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                <p className="text-sm text-gray-500 text-center py-4">
                                                  No questions added yet
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <h3 className="text-lg font-medium">Time & Deadline</h3>
                                          <div className="mt-2 space-y-3">
                                            <div className="space-y-2">
                                              <div className="flex justify-between">
                                                <Label htmlFor="timeToSpend">Time to Spend (minutes)</Label>
                                                <span className="text-sm font-medium">{timeToSpend} min</span>
                                              </div>
                                              <Slider
                                                id="timeToSpend"
                                                min={5}
                                                max={120}
                                                step={5}
                                                value={[parseInt(timeToSpend)]}
                                                onValueChange={(value) => setTimeToSpend(value[0].toString())}
                                              />
                                            </div>
                                            
                                            <div className="space-y-2">
                                              <Label htmlFor="deadline">Set Deadline</Label>
                                              <Input
                                                id="deadline"
                                                type="date"
                                                value={deadline}
                                                onChange={(e) => setDeadline(e.target.value)}
                                              />
                                              <p className="text-xs text-gray-500">
                                                Setting a deadline will automatically add this to the student's study plan
                                              </p>
                                            </div>
                                            
                                            <div className="flex items-center space-x-4">
                                              <div className="flex items-center space-x-2">
                                                <Switch
                                                  id="isUrgent"
                                                  checked={isUrgent}
                                                  onCheckedChange={setIsUrgent}
                                                />
                                                <Label htmlFor="isUrgent" className="text-sm">Mark as Urgent</Label>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <Switch
                                                  id="isTestLinked"
                                                  checked={isTestLinked}
                                                  onCheckedChange={setIsTestLinked}
                                                />
                                                <Label htmlFor="isTestLinked" className="text-sm">Test-Linked</Label>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  <DialogFooter className="mt-6">
                                    <Button onClick={handleSubmitFeedback} disabled={submittingFeedback}>
                                      {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                            
                            {hw.status === "reviewed" && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    View Feedback
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Feedback Details</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <h3 className="font-medium">{hw.title}</h3>
                                      <div className="flex items-center space-x-2">
                                        <Badge className={getSubjectColor(hw.subject)}>
                                          {hw.subject}
                                        </Badge>
                                        {getStatusBadge(hw.status)}
                                      </div>
                                      <p className="text-sm text-gray-600">
                                        Student: {hw.student_name}
                                      </p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <h4 className="font-medium text-sm">Your Feedback:</h4>
                                      <p className="text-sm p-3 bg-gray-50 rounded-md">
                                        {hw.feedback || "No written feedback provided."}
                                      </p>
                                    </div>
                                    
                                    {hw.feedback_file_url && (
                                      <div>
                                        <Button variant="outline" size="sm" className="w-full" asChild>
                                          <a href={hw.feedback_file_url} target="_blank" rel="noopener noreferrer">
                                            <FileText className="h-4 w-4 mr-2" />
                                            View Feedback File
                                          </a>
                                        </Button>
                                      </div>
                                    )}
                                    
                                    {hw.order_of_attempt && hw.order_of_attempt.length > 0 && (
                                      <div className="space-y-2">
                                        <h4 className="font-medium text-sm">Recommended Question Order:</h4>
                                        <div className="space-y-1">
                                          {hw.order_of_attempt.map((question, index) => (
                                            <div key={index} className="flex items-start space-x-2">
                                              <span className="text-sm font-medium">{index + 1}.</span>
                                              <div className="flex-1">
                                                <p className="text-sm">{question}</p>
                                                {hw.hints && hw.hints[question] && (
                                                  <p className="text-xs text-gray-600 mt-1">
                                                    Hint: {hw.hints[question]}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                                      {hw.time_to_spend && (
                                        <div className="flex items-center">
                                          <Timer className="h-4 w-4 mr-1" />
                                          <span>{hw.time_to_spend} minutes</span>
                                        </div>
                                      )}
                                      {hw.deadline && (
                                        <div className="flex items-center">
                                          <Calendar className="h-4 w-4 mr-1" />
                                          <span>Due: {formatDate(hw.deadline)}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {(hw.is_urgent || hw.is_test_linked) && (
                                      <div className="flex space-x-2">
                                        {hw.is_urgent && (
                                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                            Urgent
                                          </Badge>
                                        )}
                                        {hw.is_test_linked && (
                                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                            <BookOpen className="h-3 w-3 mr-1" />
                                            Test-Linked
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {supabase ? "No homework found" : "Supabase not connected - Running in demo mode"}
                  </p>
                  {!supabase && (
                    <p className="text-sm text-gray-500 mt-1">Connect Supabase to see real homework data</p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
