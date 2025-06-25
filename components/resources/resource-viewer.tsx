"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

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
  mentor_name?: string
}

interface ResourceViewerProps {
  resource: Resource | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ResourceViewer({ resource, open, onOpenChange }: ResourceViewerProps) {
  // Helper function to extract YouTube video ID
  const getYoutubeVideoId = (url: string) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        {resource && (
          <>
            <DialogHeader>
              <DialogTitle>{resource.title}</DialogTitle>
              <DialogDescription>
                {resource.description}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {resource.file_type === "video" ? (
                <div className="aspect-video">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={`https://www.youtube.com/embed/${getYoutubeVideoId(resource.file_url)}`} 
                    frameBorder="0" 
                    allowFullScreen
                  ></iframe>
                </div>
              ) : resource.file_type === "pdf" ? (
                <embed 
                  src={resource.file_url} 
                  type="application/pdf" 
                  width="100%" 
                  height="500px" 
                />
              ) : (
                <div className="flex justify-center">
                  <img 
                    src={resource.file_url} 
                    alt={resource.title} 
                    className="max-h-[500px] object-contain" 
                  />
                </div>
              )}
              <div className="mt-4 flex justify-between items-center">
                <div>
                  <Badge variant="outline">{resource.subject}</Badge>
                  <span className="text-sm text-muted-foreground ml-2">
                    From: {resource.mentor_name || "Your Mentor"}
                  </span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Original
                  </a>
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}