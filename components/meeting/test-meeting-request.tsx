"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"

export function TestMeetingRequest() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const testInsert = async () => {
    if (!user || !supabase) return
    
    setLoading(true)
    
    try {
      // Create a test meeting request
      const testData = {
        student_id: user.id,
        mentor_id: user.id, // Using the same ID for testing
        requested_day: new Date().toISOString().split('T')[0],
        requested_time: '12:00:00',
        topic: 'Test meeting request',
        status: 'pending'
      }
      
      console.log("Inserting test data:", testData)
      
      const { data, error } = await supabase
        .from('meeting_requests')
        .insert(testData)
        .select()
      
      if (error) {
        setResult({
          success: false,
          error: error.message,
          details: error
        })
      } else {
        setResult({
          success: true,
          data
        })
        
        // Clean up the test record
        if (data && data.length > 0) {
          await supabase
            .from('meeting_requests')
            .delete()
            .eq('id', data[0].id)
        }
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message,
        details: error
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Meeting Request</CardTitle>
        <CardDescription>
          Test the meeting request functionality
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <div className="mb-4">
            <div className="font-medium mb-2">
              {result.success ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Success
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Error
                </div>
              )}
            </div>
            
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={testInsert} 
          disabled={loading || !user}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Testing...
            </>
          ) : (
            "Test Insert"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}