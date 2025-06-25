"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"

export function AuthCheck() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const checkAuth = async () => {
    setLoading(true)
    
    try {
      const status: any = {
        clientSideAuth: !!user,
        userId: user?.id || null,
        email: user?.email || null,
        supabaseInitialized: !!supabase,
        serverSideAuth: false,
        serverSideUserId: null,
        rpcAuthCheck: false
      }
      
      if (supabase) {
        // Check server-side auth
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          status.sessionError = sessionError.message
        } else {
          status.serverSideAuth = !!sessionData.session
          status.serverSideUserId = sessionData.session?.user?.id || null
        }
        
        // Check RPC auth
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('is_authenticated')
          
          if (rpcError) {
            status.rpcError = rpcError.message
          } else {
            status.rpcAuthCheck = rpcData
          }
        } catch (err: any) {
          status.rpcError = err.message
        }
      }
      
      setAuthStatus(status)
    } catch (error: any) {
      setAuthStatus({
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [user])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          Authentication Status
        </CardTitle>
        <CardDescription>
          Check your authentication status
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Checking authentication...</span>
          </div>
        ) : authStatus ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Client-side Auth:</div>
              <div className="flex items-center">
                {authStatus.clientSideAuth ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                )}
                {authStatus.clientSideAuth ? "Authenticated" : "Not authenticated"}
              </div>
              
              <div className="font-medium">User ID:</div>
              <div>{authStatus.userId || "Not available"}</div>
              
              <div className="font-medium">Email:</div>
              <div>{authStatus.email || "Not available"}</div>
              
              <div className="font-medium">Supabase Initialized:</div>
              <div className="flex items-center">
                {authStatus.supabaseInitialized ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                )}
                {authStatus.supabaseInitialized ? "Yes" : "No"}
              </div>
              
              <div className="font-medium">Server-side Auth:</div>
              <div className="flex items-center">
                {authStatus.serverSideAuth ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                )}
                {authStatus.serverSideAuth ? "Authenticated" : "Not authenticated"}
              </div>
              
              <div className="font-medium">Server-side User ID:</div>
              <div>{authStatus.serverSideUserId || "Not available"}</div>
              
              <div className="font-medium">RPC Auth Check:</div>
              <div className="flex items-center">
                {authStatus.rpcAuthCheck ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                )}
                {authStatus.rpcAuthCheck ? "Authenticated" : "Not authenticated"}
              </div>
            </div>
            
            {authStatus.sessionError && (
              <div className="mt-4">
                <div className="font-medium text-red-500">Session Error:</div>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                  {authStatus.sessionError}
                </pre>
              </div>
            )}
            
            {authStatus.rpcError && (
              <div className="mt-4">
                <div className="font-medium text-red-500">RPC Error:</div>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                  {authStatus.rpcError}
                </pre>
              </div>
            )}
            
            {authStatus.error && (
              <div className="mt-4">
                <div className="font-medium text-red-500">Error:</div>
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                  {authStatus.error}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p>No authentication information available</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={checkAuth} 
          disabled={loading}
          className="w-full"
          variant="outline"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Auth Status
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}