"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"

interface ImgBBUploaderProps {
  onUploadComplete: (url: string) => void
  onUploadError: (error: Error) => void
  buttonText?: string
  loading?: boolean
}

export function ImgBBUploader({ 
  onUploadComplete, 
  onUploadError, 
  buttonText = "Upload Image",
  loading = false
}: ImgBBUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [localLoading, setLocalLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const uploadToImgBB = async () => {
    if (!file) return

    setLocalLoading(true)
    
    try {
      // Create form data
      const formData = new FormData()
      formData.append('image', file)
      formData.append('key', '56e6b93d96288feb9baa20dd66cbed38') // ImgBB API key
      
      // Upload to ImgBB
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error(`ImgBB API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error?.message || 'Upload failed')
      }
      
      // Get the URL from the response
      const imageUrl = data.data.url
      
      // Call the callback with the URL
      onUploadComplete(imageUrl)
      
      // Reset the file input
      setFile(null)
    } catch (error) {
      console.error('Error uploading to ImgBB:', error)
      onUploadError(error instanceof Error ? error : new Error('Unknown error'))
    } finally {
      setLocalLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="image-upload">Image</Label>
        <Input 
          id="image-upload" 
          type="file" 
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
      
      <Button
        onClick={uploadToImgBB}
        disabled={!file || loading || localLoading}
        className="w-full"
      >
        {localLoading || loading ? "Uploading..." : buttonText}
        {!localLoading && !loading && <Upload className="ml-2 h-4 w-4" />}
      </Button>
      
      {file && (
        <p className="text-sm text-gray-500">
          Selected file: {file.name} ({Math.round(file.size / 1024)} KB)
        </p>
      )}
    </div>
  )
}