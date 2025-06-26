"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, RefreshCw, Upload } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getSupabaseClient } from "@/lib/supabase/client"
import { ImgBBUploader } from "@/components/imgbb-uploader"

export default function DirectFixPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = getSupabaseClient()

  const testImgBBUpload = async () => {
    try {
      setLoading(true)
      setResult(null)
      setError(null)
      
      const results = {
        steps: [],
        success: false,
        fileUrl: ''
      }
      
      results.steps.push('Testing direct upload to ImgBB...')
      
      // Create a test image (1x1 pixel transparent PNG)
      const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      const blob = await fetch(`data:image/png;base64,${base64Data}`).then(res => res.blob())
      const testFile = new File([blob], 'test.png', { type: 'image/png' })
      
      results.steps.push('Created test image file')
      
      // Create form data
      const formData = new FormData()
      formData.append('image', testFile)
      formData.append('key', '56e6b93d96288feb9baa20dd66cbed38') // ImgBB API key
      
      results.steps.push('Sending test image to ImgBB...')
      
      // Upload to ImgBB
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      })
      
      results.steps.push(`ImgBB response status: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        throw new Error(`ImgBB API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        results.steps.push(`ImgBB upload failed: ${JSON.stringify(data.error)}`)
        throw new Error(data.error?.message || 'Upload failed')
      }
      
      // Get the URL from the response
      const imageUrl = data.data.url
      results.steps.push(`Upload to ImgBB successful! URL: ${imageUrl}`)
      
      // Now test creating a homework entry with this URL
      results.steps.push('Testing database insert with the image URL...')
      
      try {
        // Get the mentor ID for this student
        let mentorId = null
        try {
          const { data: mentorData } = await supabase
            .from('student_mentor_assignments')
            .select('mentor_id')
            .eq('student_id', user?.id)
            .single()
            
          if (mentorData) {
            mentorId = mentorData.mentor_id
            results.steps.push(`Found mentor ID: ${mentorId}`)
          }
        } catch (err) {
          results.steps.push('No mentor assigned, continuing without mentor ID')
        }
        
        // Create a test homework entry
        const testData = {
          student_id: user?.id,
          mentor_id: mentorId,
          title: 'Test Homework Entry',
          subject: 'Other',
          status: 'submitted',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          submitted_at: new Date().toISOString(),
          submission_file_url: imageUrl,
          submission_notes: 'Test submission from direct-fix page',
          student_initiated: true
        }
        
        results.steps.push(`Inserting test homework entry: ${JSON.stringify(testData)}`)
        
        const { data: newHomework, error: createError } = await supabase
          .from('homework')
          .insert(testData)
          .select()
        
        if (createError) {
          results.steps.push(`Error creating test homework entry: ${createError.message}`)
          throw createError
        }
        
        results.steps.push('Test homework entry created successfully!')
        
        // Delete the test entry
        if (newHomework && newHomework.length > 0) {
          const { error: deleteError } = await supabase
            .from('homework')
            .delete()
            .eq('id', newHomework[0].id)
          
          if (deleteError) {
            results.steps.push(`Warning: Could not delete test entry: ${deleteError.message}`)
          } else {
            results.steps.push('Test homework entry deleted successfully')
          }
        }
        
        results.success = true
        results.fileUrl = imageUrl
      } catch (dbError) {
        results.steps.push(`Database operation failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`)
      }
      
      setResult(results)
    } catch (err) {
      console.error('Error testing upload:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Direct Upload Fix</CardTitle>
          <CardDescription>
            This tool will test direct uploads to ImgBB and help fix any issues with homework submissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert className={`mb-4 ${result.success ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>{result.success ? 'Direct upload is working!' : 'Upload issues detected'}</AlertTitle>
              <AlertDescription>
                {result.success && (
                  <p className="font-medium text-green-700 mb-2">
                    Successfully uploaded to ImgBB and tested database operations
                  </p>
                )}
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {result.steps.map((step: string, index: number) => (
                    <li key={index} className="text-sm">{step}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Button onClick={testImgBBUpload} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing Direct Upload...
                </>
              ) : (
                'Test Direct Upload System'
              )}
            </Button>

            <div className="mt-6 space-y-4">
              <h3 className="font-medium">What This Does:</h3>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
                <li>Tests direct uploads to ImgBB</li>
                <li>Verifies database operations with the uploaded file URL</li>
                <li>Provides detailed diagnostic information</li>
                <li>Cleans up any test data automatically</li>
              </ol>
              
              <div className="bg-blue-50 p-4 rounded-md mt-4">
                <h4 className="font-medium text-blue-700">Next Steps:</h4>
                <p className="text-sm text-blue-600 mt-1">
                  After running this test, return to the homework page and try submitting again.
                  The system will now use direct uploads to ImgBB instead of Supabase storage.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}