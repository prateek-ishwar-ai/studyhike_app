"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export function MeetingRequestsCheck() {
  const [tableExists, setTableExists] = useState<boolean | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkTable() {
      if (!supabase) return
      
      try {
        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
            
          setIsAdmin(profileData?.role === 'admin')
        }
        
        // Check if table exists
        const { error } = await supabase
          .from('meeting_requests')
          .select('id')
          .limit(1)
        
        setTableExists(!error)
      } catch (e) {
        console.error("Error checking meeting_requests table:", e)
        setTableExists(false)
      } finally {
        setLoading(false)
      }
    }
    
    checkTable()
  }, [])
  
  if (loading || tableExists === null || tableExists === true) {
    return null
  }
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Meeting Requests Feature Unavailable</AlertTitle>
      <AlertDescription>
        The meeting requests feature requires database setup. 
        {isAdmin ? (
          <Link href="/admin/database-setup" className="font-medium underline ml-1">
            Go to Database Setup
          </Link>
        ) : (
          <span className="ml-1">Please contact an administrator.</span>
        )}
      </AlertDescription>
    </Alert>
  )
}