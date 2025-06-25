"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"

export function MeetingDiagnostic() {
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const { user } = useAuth()

  const runDiagnostic = async () => {
    setRunning(true)
    setLoading(true)

    try {
      // Initialize diagnostic info
      const info: any = {
        supabaseInitialized: !!supabase,
        authenticated: !!user,
        userId: user?.id || null,
        tableExists: false,
        canSelect: false,
        canUpdate: false,
        errorDetails: null,
        schemaError: null,
        selectError: null,
        updateError: null
      }

      if (!supabase) {
        info.errorDetails = "Supabase client not initialized"
        setDiagnosticInfo(info)
        return
      }

      if (!user) {
        info.errorDetails = "User not authenticated"
        setDiagnosticInfo(info)
        return
      }

      // Check if table exists
      try {
        const { data, error } = await supabase
          .from('meeting_requests')
          .select('id')
          .limit(1)

        if (error) {
          info.schemaError = error.message
        } else {
          info.tableExists = true
        }
      } catch (err: any) {
        info.schemaError = err.message
      }

      // Test select permission
      try {
        const { data, error } = await supabase
          .from('meeting_requests')
          .select('*')
          .eq('student_id', user.id)
          .limit(1)

        if (error) {
          info.selectError = error.message
        } else {
          info.canSelect = true
        }
      } catch (err: any) {
        info.selectError = err.message
      }

      // Test update permission
      try {
        // First create a test record
        const { data: insertData, error: insertError } = await supabase
          .from('meeting_requests')
          .insert({
            student_id: user.id,
            mentor_id: user.id, // Just for testing
            requested_day: new Date().toISOString().split('T')[0],
            requested_time: '12:00:00',
            topic: 'Test topic for diagnostic',
            status: 'pending'
          })
          .select()

        if (insertError) {
          info.updateError = `Insert error: ${insertError.message}`
        } else if (insertData && insertData.length > 0) {
          // Try to update the record
          const { error: updateError } = await supabase
            .from('meeting_requests')
            .update({ topic: 'Updated test topic' })
            .eq('id', insertData[0].id)
            .eq('student_id', user.id)

          if (updateError) {
            info.updateError = updateError.message
          } else {
            info.canUpdate = true
            
            // Clean up the test record
            await supabase
              .from('meeting_requests')
              .delete()
              .eq('id', insertData[0].id)
          }
        }
      } catch (err: any) {
        info.updateError = err.message
      }

      setDiagnosticInfo(info)
    } catch (error: any) {
      setDiagnosticInfo({
        error: error.message
      })
    } finally {
      setLoading(false)
      setRunning(false)
    }
  }

  useEffect(() => {
    if (user) {
      runDiagnostic()
    } else {
      setLoading(false)
    }
  }, [user])

  if (loading && !running) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading diagnostic tool...</span>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
          Meeting Request Diagnostic
        </CardTitle>
        <CardDescription>
          This tool helps diagnose issues with the meeting requests feature
        </CardDescription>
      </CardHeader>
      <CardContent>
        {diagnosticInfo ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Supabase Initialized:</div>
              <div className="flex items-center">
                {diagnosticInfo.supabaseInitialized ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                )}
                {diagnosticInfo.supabaseInitialized ? "Yes" : "No"}
              </div>
              
              <div className="font-medium">User Authenticated:</div>
              <div className="flex items-center">
                {diagnosticInfo.authenticated ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                )}
                {diagnosticInfo.authenticated ? "Yes" : "No"}
              </div>
              
              <div className="font-medium">User ID:</div>
              <div>{diagnosticInfo.userId || "Not available"}</div>
              
              <div className="font-medium">Table Exists:</div>
              <div className="flex items-center">
                {diagnosticInfo.tableExists ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                )}
                {diagnosticInfo.tableExists ? "Yes" : "No"}
              </div>
              
              <div className="font-medium">Can Select:</div>
              <div className="flex items-center">
                {diagnosticInfo.canSelect ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                )}
                {diagnosticInfo.canSelect ? "Yes" : "No"}
              </div>
              
              <div className="font-medium">Can Update:</div>
              <div className="flex items-center">
                {diagnosticInfo.canUpdate ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                )}
                {diagnosticInfo.canUpdate ? "Yes" : "No"}
              </div>
            </div>
            
            {diagnosticInfo.errorDetails && (
              <div className="mt-4">
                <div className="font-medium text-red-500">Error:</div>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                  {diagnosticInfo.errorDetails}
                </pre>
              </div>
            )}
            
            {diagnosticInfo.schemaError && (
              <div className="mt-4">
                <div className="font-medium text-red-500">Schema Error:</div>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                  {diagnosticInfo.schemaError}
                </pre>
              </div>
            )}
            
            {diagnosticInfo.selectError && (
              <div className="mt-4">
                <div className="font-medium text-red-500">Select Error:</div>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                  {diagnosticInfo.selectError}
                </pre>
              </div>
            )}
            
            {diagnosticInfo.updateError && (
              <div className="mt-4">
                <div className="font-medium text-red-500">Update Error:</div>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                  {diagnosticInfo.updateError}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p>No diagnostic information available</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={runDiagnostic} 
          disabled={running}
          className="w-full"
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Running Diagnostic...
            </>
          ) : (
            "Run Diagnostic"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}