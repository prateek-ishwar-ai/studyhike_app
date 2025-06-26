"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Clock, FileText, Upload, X, Star } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase/client"
import { ImgBBUploader } from "@/components/imgbb-uploader"

interface Homework {
  id: string
  title: string
  subject: string
  mentor_name: string
  due_date: string
  status: "pending" | "submitted" | "reviewed" | "needs_rework"
  feedback?: string
  score?: number
  submission_file_url?: string
  description?: string
  created_at: string
  order_of_attempt?: string[]
  hints?: Record<string, string>
  time_to_spend?: string
  is_urgent?: boolean
  is_test_linked?: boolean
  student_comments?: string
}

export default function HomeworkPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const [homeworkList, setHomeworkList] = useState<Homework[]>([])
  const [fetchLoading, setFetchLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const supabase = getSupabaseClient()

  useEffect(() => {
    if (user) {
      fetchHomework()
    }
  }, [user])

  const fetchHomework = async () => {
    if (!supabase || !user) {
      setFetchLoading(false)
      return
    }

    try {
      // Get homework from the homework table
      const { data: homeworkData, error: homeworkError } = await supabase
        .from("homework")
        .select(`
          *,
          mentor:mentor_id(full_name)
        `)
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })

      if (homeworkError) {
        console.error("Error fetching homework:", homeworkError)
      }

      // Format homework data
      const formattedHomeworkData = homeworkData?.map((item) => ({
        id: item.id,
        title: item.title,
        subject: item.subject,
        mentor_name: item.mentor?.full_name || "Unknown Mentor",
        due_date: item.due_date,
        status: item.status,
        feedback: item.feedback,
        score: item.score,
        submission_file_url: item.submission_file_url,
        description: item.description,
        created_at: item.created_at,
        student_comments: item.submission_notes
      })) || []
      
      setHomeworkList(formattedHomeworkData)
    } catch (error) {
      console.error("Error fetching homework:", error)
    } finally {
      setFetchLoading(false)
    }
  }

  const pendingHomework = homeworkList.filter((hw) => hw.status === "pending" || hw.status === "needs_rework")
  const submittedHomework = homeworkList.filter((hw) => hw.status === "submitted" || hw.status === "reviewed")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Validate file type
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
      if (!allowedTypes.includes(selectedFile.type)) {
        alert("Please upload only PDF, JPG, or PNG files")
        return
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("File size should be less than 10MB")
        return
      }

      setFile(selectedFile)
    }
  }

  const handleSubmitWithUrl = async (imageUrl: string) => {
    if (!selectedHomework || !supabase || !user) {
      alert("Please select a homework assignment")
      return
    }

    console.log("Starting homework submission process with URL:", imageUrl)
    
    setLoading(true)

    try {
      // Update homework record with file URL and status
      console.log("Updating homework record with ID:", selectedHomework.id);
      
      try {
        const updatePayload = {
          status: "submitted",
          submission_file_url: imageUrl,
          submission_notes: response || null,
          submitted_at: new Date().toISOString(),
        };
        
        console.log("Update data:", JSON.stringify(updatePayload));
        
        const { data: updatedRecord, error } = await supabase
          .from("homework")
          .update(updatePayload)
          .eq("id", selectedHomework.id)
          .eq("student_id", user.id)
          .select();
  
        if (error) {
          console.error("Error updating homework:", error);
          throw error;
        }
        
        console.log("Homework updated successfully:", updatedRecord);
      } catch (dbError) {
        console.error("Database operation failed:", dbError);
        throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
      }

      // Refresh homework list
      await fetchHomework()

      // Reset form
      setResponse("")
      setSelectedHomework(null)

      // Close any open dialogs
      const dialogs = document.querySelectorAll('[role="dialog"]');
      dialogs.forEach(dialog => {
        // Find the close button and click it
        const closeButton = dialog.querySelector('button[aria-label="Close"]');
        if (closeButton) {
          (closeButton as HTMLButtonElement).click();
        }
      });

      // Show success message
      alert("Homework submitted successfully!")
    } catch (error) {
      console.error("Error submitting homework:", error)
      
      // Provide more detailed error message
      let errorMessage = "Failed to submit homework. Please try again.";
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
        console.error("Full error details:", error);
      }
      
      // Show error message
      alert(errorMessage);
    } finally {
      setLoading(false)
    }
  }
  
  const handleSelfSubmitWithUrl = async (imageUrl: string) => {
    if (!response || !supabase || !user) {
      alert("Please provide a title for your homework")
      return
    }

    setLoading(true)

    try {
      console.log("Starting self-initiated homework submission with URL:", imageUrl);
      
      // Get the mentor ID for this student
      let mentorId = null;
      try {
        const { data: mentorData } = await supabase
          .from('student_mentor_assignments')
          .select('mentor_id')
          .eq('student_id', user.id)
          .single();
          
        if (mentorData) {
          mentorId = mentorData.mentor_id;
          console.log("Found mentor ID:", mentorId);
        }
      } catch (err) {
        console.log("No mentor assigned, continuing without mentor ID");
      }
      
      // Create the homework entry with the file URL
      console.log("Creating homework entry with file URL:", imageUrl);
      
      try {
        // Prepare the homework data
        const homeworkData = {
          student_id: user.id,
          mentor_id: mentorId, // Use the mentor ID if available
          title: response,
          subject: "Other", // Default subject
          status: "submitted", // Set as submitted immediately since we already uploaded the file
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default due date: 1 week
          created_at: new Date().toISOString(),
          submitted_at: new Date().toISOString(),
          submission_file_url: imageUrl, // Use the provided image URL
          submission_notes: "Student-initiated homework submission",
          student_initiated: true // Flag to indicate this was initiated by the student
        };
        
        console.log("Homework data to insert:", JSON.stringify(homeworkData));
        
        const { data: newHomework, error: createError } = await supabase
          .from("homework")
          .insert(homeworkData)
          .select();
        
        if (createError) {
          console.error("Error creating homework entry:", createError);
          throw createError;
        }
        
        if (!newHomework || newHomework.length === 0) {
          throw new Error("Failed to create homework entry");
        }
        
        console.log("Homework created successfully:", newHomework);
      } catch (dbError) {
        console.error("Database operation failed:", dbError);
        throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
      }

      // Refresh homework list
      await fetchHomework()

      // Reset form
      setResponse("")

      // Close the dialog
      setIsDialogOpen(false)

      // Show success message
      alert("Your homework has been submitted for review!")
    } catch (error) {
      console.error("Error submitting self-initiated homework:", error)
      
      // Provide more detailed error message
      let errorMessage = "Failed to submit homework. Please try again.";
      if (error instanceof Error) {
        errorMessage = `Error: ${error.message}`;
        console.error("Full error details:", error);
      }
      
      // Show error message
      alert(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        )
      case "submitted":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Submitted
          </Badge>
        )
      case "reviewed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Reviewed
          </Badge>
        )
      case "needs_rework":
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
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
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Homework</h1>
          <p className="text-gray-600">View and submit your homework assignments</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Submit Your Own
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Your Own Homework</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic/Question</Label>
                <Textarea
                  id="topic"
                  placeholder="Enter your homework topic or question here..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <ImgBBUploader 
                  onUploadComplete={(url) => {
                    console.log("Image uploaded successfully:", url);
                    handleSelfSubmitWithUrl(url);
                  }}
                  onUploadError={(error) => {
                    console.error("Image upload failed:", error);
                    alert(`Upload failed: ${error.message}`);
                  }}
                  buttonText="Upload Homework"
                  loading={loading}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending ({pendingHomework.length})
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Submitted ({submittedHomework.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {fetchLoading ? (
            <div className="text-center py-10">Loading...</div>
          ) : pendingHomework.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <CheckCircle className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-xl font-medium text-gray-500">No pending homework</p>
                <p className="text-gray-400">You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingHomework.map((homework) => (
                <Card key={homework.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge className={getSubjectColor(homework.subject)}>
                        {homework.subject}
                      </Badge>
                      {getStatusBadge(homework.status)}
                    </div>
                    <CardTitle className="text-lg mt-2">{homework.title}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Due: {formatDate(homework.due_date)}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {homework.description && (
                      <p className="text-sm text-gray-600 mb-4">{homework.description}</p>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setSelectedHomework(homework)}
                          className="w-full"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Submit Homework
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Submit Homework</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <h3 className="font-medium">{selectedHomework?.title}</h3>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <Clock className="h-4 w-4 mr-1" />
                              <span>
                                Due: {selectedHomework?.due_date && formatDate(selectedHomework.due_date)}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="response">Your Response (Optional)</Label>
                            <Textarea
                              id="response"
                              placeholder="Add any comments or notes about your submission..."
                              value={response}
                              onChange={(e) => setResponse(e.target.value)}
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <ImgBBUploader 
                              onUploadComplete={(url) => {
                                console.log("Image uploaded successfully:", url);
                                handleSubmitWithUrl(url);
                              }}
                              onUploadError={(error) => {
                                console.error("Image upload failed:", error);
                                alert(`Upload failed: ${error.message}`);
                              }}
                              buttonText="Upload Homework"
                              loading={loading}
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submitted" className="mt-6">
          {fetchLoading ? (
            <div className="text-center py-10">Loading...</div>
          ) : submittedHomework.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Upload className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-xl font-medium text-gray-500">No submitted homework</p>
                <p className="text-gray-400">Submit your first homework assignment!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submittedHomework.map((homework) => (
                <Card key={homework.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge className={getSubjectColor(homework.subject)}>
                        {homework.subject}
                      </Badge>
                      {getStatusBadge(homework.status)}
                    </div>
                    <CardTitle className="text-lg mt-2">{homework.title}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Submitted: {formatDate(homework.created_at)}</span>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {homework.status === "reviewed" && (
                      <div className="mb-4">
                        <div className="flex items-center mb-2">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="font-medium">Score: {homework.score}/100</span>
                        </div>
                        {homework.feedback && (
                          <div className="p-3 bg-gray-50 rounded-md text-sm">
                            <p className="font-medium mb-1">Feedback:</p>
                            <p className="text-gray-600">{homework.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {homework.submission_file_url && (
                      <div className="mt-2">
                        {/* Display image directly if it's an image URL */}
                        {homework.submission_file_url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                          <div className="border rounded-md overflow-hidden mb-2">
                            <img 
                              src={homework.submission_file_url} 
                              alt="Homework submission" 
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        ) : null}
                        
                        <Button variant="outline" className="w-full" asChild>
                          <a
                            href={homework.submission_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View Submission
                          </a>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}