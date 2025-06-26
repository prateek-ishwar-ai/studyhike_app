"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { BookOpen, Video, FileText, Image as ImageIcon, ExternalLink, Download, Upload, Filter, Search, X, Plus, Check, Eye } from "lucide-react"

interface Resource {
  id: string
  title: string
  description: string
  file_type: "video" | "pdf" | "image"
  file_url: string
  subject: string
  difficulty_level?: string
  created_at: string
  uploaded_by: string
  shared_with?: string
  student_name?: string
  is_approved: boolean
}

interface HomeworkSubmission {
  id: string
  title: string
  description: string
  subject: string
  submission_file_url: string
  due_date: string
  status: "pending" | "submitted" | "reviewed"
  feedback?: string
  score?: number
  student_id: string
  student_name?: string
  mentor_id: string
  created_at: string
}

interface Student {
  id: string
  full_name: string
}

export default function MentorResourcesPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [resources, setResources] = useState<Resource[]>([])
  const [homework, setHomework] = useState<HomeworkSubmission[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [studentFilter, setStudentFilter] = useState<string>("all")
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  
  // Resource upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    file_type: "video" as "video" | "pdf" | "image",
    file_url: "",
    subject: "Mathematics",
    difficulty_level: "medium",
    shared_with: ""
  })
  
  // Handle file upload to ImageBB
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
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
    if (
      (newResource.file_type === 'image' && !fileType.startsWith('image/')) || 
      (newResource.file_type === 'pdf' && fileType !== 'application/pdf')
    ) {
      toast({
        title: "Invalid file type",
        description: `Only ${newResource.file_type === 'pdf' ? 'PDFs' : 'images'} are allowed for this resource type`,
        variant: "destructive"
      })
      return
    }
    
    try {
      setUploading(true)
      
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
        // Set the link
        setNewResource({
          ...newResource,
          file_url: data.data.url
        })
        
        toast({
          title: "File uploaded",
          description: "Your file has been uploaded successfully",
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
      setUploading(false)
    }
  }
  
  // Homework feedback state
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [selectedHomework, setSelectedHomework] = useState<HomeworkSubmission | null>(null)
  const [feedbackText, setFeedbackText] = useState("")
  
  // Resource preview state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewResource, setPreviewResource] = useState<Resource | null>(null)

  // Check if user is authorized to view this page
  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    if (profile && profile.role !== 'mentor') {
      router.push('/student/dashboard')
      return
    }
  }, [user, profile, authLoading, router])

  // Fetch resources, homework submissions, and students
  useEffect(() => {
    async function fetchData() {
      if (!user) return
      
      try {
        setLoading(true)
        
        // Fetch students
        const { data: studentsData, error: studentsError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'student')
          .order('full_name')
        
        if (studentsError) {
          console.error('Error fetching students:', studentsError)
        } else if (studentsData) {
          setStudents(studentsData)
        }
        
        // Fetch resources
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('*')
          .eq('uploaded_by', user.id)
          .order('created_at', { ascending: false })
        
        if (resourcesError) {
          console.error('Error fetching resources:', resourcesError)
        } else if (resourcesData) {
          // Transform data to include student name if shared_with exists
          const transformedResources = await Promise.all(resourcesData.map(async resource => {
            let studentName = 'All Students';
            
            // If resource has shared_with, get the student name
            if (resource.shared_with) {
              const { data: studentData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', resource.shared_with)
                .single();
                
              if (studentData) {
                studentName = studentData.full_name;
              }
            }
            
            return {
              ...resource,
              student_name: studentName
            };
          }))
          setResources(transformedResources)
        }
        
        // Fetch homework submissions
        const { data: homeworkData, error: homeworkError } = await supabase
          .from('homework')
          .select('*, profiles!homework_student_id_fkey(full_name)')
          .eq('mentor_id', user.id)
          .order('created_at', { ascending: false })
        
        if (homeworkError) {
          console.error('Error fetching homework submissions:', homeworkError)
        } else if (homeworkData) {
          // Transform data to include student name
          const transformedHomework = homeworkData.map(submission => ({
            ...submission,
            student_name: submission.profiles?.full_name || 'Unknown Student'
          }))
          setHomework(transformedHomework)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          title: "Error loading resources",
          description: "There was a problem loading resources. Please try again later.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user])

  // Filter resources based on search query and filters
  const filteredResources = resources.filter(resource => {
    const matchesSearch = 
      searchQuery === "" || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStudent = 
      studentFilter === "all" || 
      (resource.shared_with && resource.shared_with === studentFilter)
    
    const matchesSubject = 
      subjectFilter === "all" || 
      resource.subject.toLowerCase() === subjectFilter.toLowerCase()
    
    const matchesType = 
      typeFilter === "all" || 
      resource.file_type === typeFilter
    
    return matchesSearch && matchesStudent && matchesSubject && matchesType
  })

  // Filter homework based on search query and filters
  const filteredHomework = homework.filter(submission => {
    const matchesSearch = 
      searchQuery === "" || 
      submission.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.subject.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStudent = 
      studentFilter === "all" || 
      submission.student_id === studentFilter
    
    const matchesSubject = 
      subjectFilter === "all" || 
      submission.subject.toLowerCase() === subjectFilter.toLowerCase()
    
    return matchesSearch && matchesStudent && matchesSubject
  })

  // Get unique subjects for filter dropdown
  const subjects = [...new Set([...resources.map(resource => resource.subject), ...homework.map(hw => hw.subject)])]

  // Handle resource upload
  const handleResourceUpload = async () => {
    if (!user) return
    
    // Validate form
    if (!newResource.title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a title for the resource",
        variant: "destructive"
      })
      return
    }
    
    if (!newResource.file_url.trim()) {
      toast({
        title: "Missing file",
        description: newResource.file_type === "video" 
          ? "Please enter a YouTube URL for the resource" 
          : "Please upload a file for the resource",
        variant: "destructive"
      })
      return
    }
    
    try {
      setUploading(true)
      
      // Validate YouTube link if type is video
      if (newResource.file_type === "video" && !isValidYoutubeUrl(newResource.file_url)) {
        toast({
          title: "Invalid YouTube URL",
          description: "Please enter a valid YouTube URL",
          variant: "destructive"
        })
        setLoading(false)
        return
      }
      
      // Validate ImageBB link for PDFs and images
      if ((newResource.file_type === "pdf" || newResource.file_type === "image") && !newResource.file_url.includes("ibb.co")) {
        toast({
          title: "Invalid ImageBB URL",
          description: "Please enter a valid ImageBB URL for PDFs and images",
          variant: "destructive"
        })
        setLoading(false)
        return
      }
      
      // Prepare resource data
      const resourceData: any = {
        title: newResource.title,
        description: newResource.description,
        file_type: newResource.file_type,
        file_url: newResource.file_url,
        subject: newResource.subject,
        difficulty_level: newResource.difficulty_level,
        uploaded_by: user.id,
        is_approved: true
      };
      
      // Add shared_with if a specific student is selected
      if (newResource.shared_with && newResource.shared_with !== 'all') {
        resourceData.shared_with = newResource.shared_with;
      }
      
      // Insert resource into database
      const { data, error } = await supabase
        .from('resources')
        .insert(resourceData)
        .select()
      
      if (error) {
        console.error('Error uploading resource:', error)
        toast({
          title: "Upload failed",
          description: "There was a problem uploading the resource. Please try again.",
          variant: "destructive"
        })
      } else {
        // Get student name or use "All Students" if shared with everyone
        let studentName = "All Students"
        if (newResource.shared_with && newResource.shared_with !== 'all') {
          const student = students.find(s => s.id === newResource.shared_with)
          if (student) {
            studentName = student.full_name
          }
        }
        
        // Add the new resource to the state
        if (data && data.length > 0) {
          setResources([
            {
              ...data[0],
              student_name: studentName
            },
            ...resources
          ])
        }
        
        toast({
          title: "Resource uploaded",
          description: `Resource has been shared with ${studentName}.`,
          variant: "default"
        })
        
        // Reset form and close dialog
        setNewResource({
          title: "",
          description: "",
          file_type: "video",
          file_url: "",
          subject: "Mathematics",
          difficulty_level: "medium",
          shared_with: ""
        })
        setUploadDialogOpen(false)
      }
    } catch (error) {
      console.error('Error in resource upload:', error)
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle homework feedback submission
  const handleFeedbackSubmit = async () => {
    if (!user || !selectedHomework) return
    
    try {
      setLoading(true)
      
      // Update homework submission with feedback
      const { error } = await supabase
        .from('homework')
        .update({
          feedback: feedbackText,
          status: 'reviewed'
        })
        .eq('id', selectedHomework.id)
      
      if (error) {
        console.error('Error submitting feedback:', error)
        toast({
          title: "Feedback submission failed",
          description: "There was a problem submitting your feedback. Please try again.",
          variant: "destructive"
        })
      } else {
        // Update homework in state
        setHomework(homework.map(submission => 
          submission.id === selectedHomework.id
            ? { ...submission, feedback: feedbackText, status: 'reviewed' }
            : submission
        ))
        
        toast({
          title: "Feedback submitted",
          description: "Your feedback has been submitted to the student.",
          variant: "default"
        })
        
        // Reset form and close dialog
        setFeedbackText("")
        setSelectedHomework(null)
        setFeedbackDialogOpen(false)
      }
    } catch (error) {
      console.error('Error in feedback submission:', error)
      toast({
        title: "Submission failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Helper function to validate YouTube URL
  const isValidYoutubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
    return youtubeRegex.test(url)
  }

  // Helper function to extract YouTube video ID
  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Learning Resources</h1>
        <p className="text-muted-foreground">
          Share resources with students and review homework
        </p>
      </div>

      <Tabs defaultValue="resources" className="space-y-6">
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="homework">Homework</TabsTrigger>
        </TabsList>
        
        <TabsContent value="resources" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Shared Resources</h2>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Resource
            </Button>
          </div>
          
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>Student</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>Subject</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject.toLowerCase()}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>Type</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="pdf">PDFs</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Resources grid */}
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map(resource => (
                <Card key={resource.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <Badge>
                        {resource.file_type === "video" ? "Video" : 
                         resource.file_type === "pdf" ? "PDF" : "Image"}
                      </Badge>
                    </div>
                    <CardDescription>{resource.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="aspect-video bg-muted rounded-md mb-4 overflow-hidden">
                      {resource.file_type === "video" ? (
                        <div className="flex items-center justify-center h-full bg-black">
                          <Video className="h-12 w-12 text-white opacity-70" />
                        </div>
                      ) : resource.file_type === "pdf" ? (
                        <div className="flex items-center justify-center h-full">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                        </div>
                      ) : (
                        <img 
                          src={resource.file_url} 
                          alt={resource.title} 
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline">{resource.subject}</Badge>
                      <Badge variant="secondary">
                        Shared with: {resource.student_name}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {new Date(resource.created_at).toLocaleDateString()}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => {
                        setPreviewResource(resource)
                        setPreviewDialogOpen(true)
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No resources found</h3>
                <p className="text-muted-foreground mb-6">
                  {resources.length === 0 
                    ? "You haven't shared any resources with your students yet."
                    : "No resources match your current filters."}
                </p>
                {resources.length === 0 ? (
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Your First Resource
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => {
                    setSearchQuery("")
                    setStudentFilter("all")
                    setSubjectFilter("all")
                    setTypeFilter("all")
                  }}>
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="homework" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Homework Submissions</h2>
          </div>
          
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search homework..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Select value={studentFilter} onValueChange={setStudentFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>Student</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>Subject</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject.toLowerCase()}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Homework grid */}
          {filteredHomework.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHomework.map(submission => (
                <Card key={submission.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{submission.title}</CardTitle>
                      <Badge variant={submission.status === "reviewed" ? "default" : "outline"}>
                        {submission.status === "reviewed" ? "Reviewed" : "Pending"}
                      </Badge>
                    </div>
                    <CardDescription>
                      {submission.subject} - {submission.student_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="aspect-video bg-muted rounded-md mb-4 overflow-hidden">
                      {submission.file_type === "image" ? (
                        <img 
                          src={submission.submission_file_url} 
                          alt={submission.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-muted-foreground">
                        Submitted: {new Date(submission.created_at).toLocaleDateString()}
                      </span>
                      <Button variant="outline" size="sm" asChild>
                        <a href={submission.submission_file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Full
                        </a>
                      </Button>
                    </div>
                    {submission.feedback ? (
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm font-medium mb-1">Your Feedback:</p>
                        <p className="text-sm">{submission.feedback}</p>
                      </div>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          setSelectedHomework(submission)
                          setFeedbackDialogOpen(true)
                        }}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Provide Feedback
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No homework submissions</h3>
                <p className="text-muted-foreground mb-6">
                  {homework.length === 0 
                    ? "Your students haven't submitted any homework yet."
                    : "No submissions match your current filters."}
                </p>
                {homework.length > 0 && (
                  <Button variant="outline" onClick={() => {
                    setSearchQuery("")
                    setStudentFilter("all")
                    setSubjectFilter("all")
                  }}>
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Resource Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Upload Resource</DialogTitle>
            <DialogDescription>
              Share a resource with your student. You can upload YouTube videos, PDFs, or images.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={newResource.title}
                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select 
                value={newResource.file_type} 
                onValueChange={(value: "video" | "pdf" | "image") => 
                  setNewResource({ ...newResource, file_type: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">YouTube Video</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="link" className="text-right">
                {newResource.file_type === "video" ? "Video URL" : "File"}
              </Label>
              <div className="col-span-3 space-y-1">
                {newResource.file_type === "video" ? (
                  <>
                    <Input
                      id="link"
                      value={newResource.file_url}
                      onChange={(e) => setNewResource({ ...newResource, file_url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter a YouTube video URL
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex flex-col space-y-2">
                      <Input
                        id="file"
                        type="file"
                        accept={newResource.file_type === "pdf" ? "application/pdf" : "image/*"}
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                      {newResource.file_url && (
                        <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                          {newResource.file_type === "image" ? (
                            <ImageIcon className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          <span className="text-sm truncate flex-1">File uploaded successfully</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {newResource.file_type === "pdf" ? "Upload a PDF file (max 10MB)" : "Upload an image (max 10MB)"}
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject
              </Label>
              <Select 
                value={newResource.subject} 
                onValueChange={(value) => 
                  setNewResource({ ...newResource, subject: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="Geography">Geography</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="difficulty" className="text-right">
                Difficulty
              </Label>
              <Select 
                value={newResource.difficulty_level} 
                onValueChange={(value) => 
                  setNewResource({ ...newResource, difficulty_level: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="student" className="text-right">
                Student
              </Label>
              <Select 
                value={newResource.shared_with} 
                onValueChange={(value) => 
                  setNewResource({ ...newResource, shared_with: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleResourceUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <LoadingSpinner className="mr-2" size="sm" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Resource
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Homework Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Provide Feedback</DialogTitle>
            <DialogDescription>
              Review the homework and provide feedback to the student.
            </DialogDescription>
          </DialogHeader>
          {selectedHomework && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h3 className="font-medium">{selectedHomework.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedHomework.subject} - Submitted by {selectedHomework.student_name}
                </p>
                <div className="aspect-video bg-muted rounded-md overflow-hidden">
                  {selectedHomework.file_type === "image" ? (
                    <img 
                      src={selectedHomework.submission_file_url} 
                      alt={selectedHomework.topic} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <embed 
                      src={selectedHomework.submission_file_url} 
                      type="application/pdf" 
                      width="100%" 
                      height="100%" 
                    />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">Your Feedback</Label>
                <Textarea
                  id="feedback"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Provide your feedback on this homework submission..."
                  rows={5}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit" onClick={handleFeedbackSubmit}>
              <Check className="mr-2 h-4 w-4" />
              Submit Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Resource Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewResource?.title}</DialogTitle>
            <DialogDescription>
              {previewResource?.description}
            </DialogDescription>
          </DialogHeader>
          {previewResource && (
            <div className="py-4">
              {previewResource.file_type === "video" ? (
                <div className="aspect-video">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${getYoutubeVideoId(previewResource.file_url)}`} 
                    frameBorder="0" 
                    allowFullScreen
                  ></iframe>
                </div>
              ) : previewResource.file_type === "pdf" ? (
                <embed 
                  src={previewResource.file_url} 
                  type="application/pdf" 
                  width="100%" 
                  height="500px" 
                />
              ) : (
                <div className="flex justify-center">
                  <img 
                    src={previewResource.file_url} 
                    alt={previewResource.title} 
                    className="max-h-[500px] object-contain" 
                  />
                </div>
              )}
              <div className="mt-4 flex justify-between items-center">
                <div>
                  <Badge variant="outline">{previewResource.subject}</Badge>
                  <span className="text-sm text-muted-foreground ml-2">
                    Shared with {previewResource.student_name}
                  </span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={previewResource.file_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Original
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}