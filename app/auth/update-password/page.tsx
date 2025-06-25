"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, CheckCircle, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Spinner } from "@/components/ui/spinner"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [role, setRole] = useState("student")
  
  const router = useRouter()
  
  // If we have a countdown, decrement it each second
  useEffect(() => {
    if (success && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (success && countdown === 0) {
      redirectToDashboard()
    }
  }, [success, countdown])
  
  // Check for role in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedRole = localStorage.getItem('userRole')
      if (storedRole) {
        setRole(storedRole)
      }
    }
  }, [])
  
  useEffect(() => {
    // Check if we have a hash in the URL (from password reset email)
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1)
      if (hash) {
        const params = new URLSearchParams(hash)
        const accessToken = params.get("access_token")
        const refreshToken = params.get("refresh_token")
        const type = params.get("type")

        if (type === "recovery" && accessToken) {
          // Set the session with the recovery tokens
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          })
        }
      }
    }
  }, [])
  
  // Function to redirect to the appropriate dashboard
  const redirectToDashboard = () => {
    const dashboardPath = role === "student" 
      ? "/student/dashboard" 
      : role === "mentor" 
        ? "/mentor/dashboard" 
        : "/admin/dashboard"
    
    // Mark as recently verified to prevent dashboard bounces
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('recently_verified', 'true')
    }
    
    router.push(dashboardPath)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate passwords
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }
    
    try {
      setLoading(true)
      setError("")
      
      // Update the password using the hash in the URL
      const { error } = await supabase.auth.updateUser({
        password: password
      })
      
      if (error) {
        throw error
      }
      
      // Password updated successfully
      setSuccess(true)
      
    } catch (err: any) {
      console.error("Password update error:", err)
      setError(err.message || "Failed to update password")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">JEE Mentor</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Update Your Password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <Card>
          {success ? (
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <CardTitle>Password Updated!</CardTitle>
                <CardDescription>
                  Your password has been successfully updated.
                  You will be redirected to your dashboard in {countdown} seconds.
                </CardDescription>
                <Button 
                  onClick={redirectToDashboard} 
                  className="w-full"
                >
                  Go to Dashboard Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle>Create New Password</CardTitle>
                <CardDescription>
                  Choose a strong password for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="mt-1"
                      placeholder="Enter your new password"
                      minLength={6}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="mt-1"
                      placeholder="Confirm your new password"
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full py-6" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <Spinner size="sm" className="mr-2" /> Updating Password...
                      </span>
                    ) : (
                      "Update Password"
                    )}
                  </Button>

                  <div className="text-center mt-4">
                    <Link href="/auth/login" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                      Back to sign in
                    </Link>
                  </div>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
