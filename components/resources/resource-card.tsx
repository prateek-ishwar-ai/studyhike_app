"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Video, FileText, Image as ImageIcon, ExternalLink } from "lucide-react"

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

interface ResourceCardProps {
  resource: Resource
  onClick: () => void
}

export function ResourceCard({ resource, onClick }: ResourceCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
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
        <div className="flex justify-between items-center">
          <Badge variant="outline">{resource.subject}</Badge>
          <span className="text-sm text-muted-foreground">
            {new Date(resource.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}