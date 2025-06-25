"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Upload, Image as ImageIcon, FileText } from "lucide-react"

interface HomeworkUploaderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (data: any) => void
  userId: string | undefined
}

export function HomeworkUploader({ open, onOpenChange, onSuccess, userId }: HomeworkUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [homework, setHomework] = useState({
    subject: "Mathematics",
    topic: "",
    link: "",
    file_type: "image" as "image" | "pdf"
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
    if (!fileType.startsWith('image/') && fileType !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Only images and PDFs are allowed",
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
        // Set the link and file type
        setHomework({
          ...homework,
          link: data.data.url,
          file_type: fileType.startsWith('image/') ? 'image' : 'pdf'
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

  // Handle homework submission
  const handleSubmit = async () => {
    if (!userId) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to submit homework",
        variant: "destructive"
      })
      return
    }
    
    // Validate form
    if (!homework.topic.trim()) {
      toast({
        title: "Missing topic",
        description: "Please enter a topic for your homework",
        variant: "destructive"
      })
      return
    }
    
    if (!homework.link) {
      toast({
        title: "No file uploaded",
        description: "Please upload a file for your homework",
        variant: "destructive"
      })
      return
    }
    
    try {
      setUploading(true)
      
      // Get mentor ID for this student
      const { data: mentorData, error: mentorError } = await supabase
        .from('student_mentor_assignments')
        .select('mentor_id')
        .eq('student_id', userId)
        .single()
      
      if (mentorError) {
        console.error('Error getting mentor:', mentorError)
        toast({
          title: "Submission error",
          description: "Could not find your mentor. Please contact support.",
          variant: "destructive"
        })
        return
      }
      
      // Insert homework submission
      const { data, error } = await supabase
        .from('homework')
        .insert({
          subject: homework.subject,
          title: homework.topic,
          description: `Homework submission for ${homework.subject}`,
          submission_file_url: homework.link,
          student_id: userId,
          mentor_id: mentorData.mentor_id,
          status: 'submitted',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        })
        .select()
      
      if (error) {
        console.error('Error submitting homework:', error)
        toast({
          title: "Submission failed",
          description: "There was a problem submitting your homework. Please try again.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Homework submitted",
          description: "Your homework has been submitted successfully",
          variant: "default"
        })
        
        // Reset form and close dialog
        setHomework({
          subject: "Mathematics",
          topic: "",
          link: "",
          file_type: "image"
        })
        onOpenChange(false)
        
        // Call success callback
        if (data) {
          onSuccess(data)
        }
      }
    } catch (error) {
      console.error('Error in homework submission:', error)
      toast({
        title: "Submission failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Submit Homework</DialogTitle>
          <DialogDescription>
            Upload your completed homework for your mentor to review.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">
              Subject
            </Label>
            <Select 
              value={homework.subject} 
              onValueChange={(value) => 
                setHomework({ ...homework, subject: value })
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
            <Label htmlFor="topic" className="text-right">
              Topic
            </Label>
            <Input
              id="topic"
              value={homework.topic}
              onChange={(e) => setHomework({ ...homework, topic: e.target.value })}
              placeholder="e.g., Algebra Homework 3"
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              File
            </Label>
            <div className="col-span-3 space-y-2">
              <Input
                id="file"
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="col-span-3"
              />
              <p className="text-xs text-muted-foreground">
                Upload an image or PDF of your completed homework (max 10MB)
              </p>
              {homework.link && (
                <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                  {homework.file_type === "image" ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span className="text-sm truncate flex-1">File uploaded successfully</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={uploading}>
            {uploading ? (
              <>
                <LoadingSpinner className="mr-2" size="sm" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit Homework
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}