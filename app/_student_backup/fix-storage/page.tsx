"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

export default function FixStoragePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fixStorage = async () => {
    try {
      setLoading(true)
      setResult(null)
      setError(null)

      const response = await fetch('/api/fix-storage')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix storage')
      }

      setResult(data)
    } catch (err) {
      console.error('Error fixing storage:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Fix Homework Storage</CardTitle>
          <CardDescription>
            If you're having trouble submitting homework, this tool can help fix storage issues.
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
            <Alert className={`mb-4 ${result.details.success ? 'bg-green-50' : 'bg-yellow-50'}`}>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>{result.message}</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {result.details.steps.map((step: string, index: number) => (
                    <li key={index} className="text-sm">{step}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <Button onClick={fixStorage} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking Storage...
              </>
            ) : (
              'Check Storage Status'
            )}
          </Button>

          <div className="mt-6 space-y-4">
            <h3 className="font-medium">Troubleshooting Steps:</h3>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
              <li>Click the button above to check your storage access</li>
              <li>Return to the homework page and try submitting again</li>
              <li>If you still have issues, try using a different file format (PDF, JPG, or PNG)</li>
              <li>Make sure your file is smaller than 10MB</li>
              <li>Try using a different browser or clearing your browser cache</li>
            </ol>
            
            <div className="bg-blue-50 p-4 rounded-md mt-4">
              <h4 className="font-medium text-blue-700">Note:</h4>
              <p className="text-sm text-blue-600">
                The system will now try multiple storage buckets when you submit homework, 
                which should resolve most upload issues automatically.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}