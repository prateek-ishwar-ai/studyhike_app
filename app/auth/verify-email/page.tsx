"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, CheckCircle, Mail, ArrowRight } from "lucide-react"

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("student")
  const [magicLink, setMagicLink] = useState("")
  const [countdown, setCountdown] = useState(10)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Get email from query params or localStorage
    const queryEmail = searchParams?.get('email')
    const storedEmail = typeof window !== 'undefined' ? localStorage.getItem('pendingVerificationEmail') : null
    
    if (queryEmail) {
      setEmail(queryEmail)
    } else if (storedEmail) {
      setEmail(storedEmail)
    }
    
    // Get role from localStorage
    const storedRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
    if (storedRole) {
      setRole(storedRole)
    }
    
    // Check if we have a verification link stored
    const storedLink = typeof window !== 'undefined' ? localStorage.getItem('verificationLink') : null
    if (storedLink) {
      setMagicLink(storedLink)
    }
    
    // Clean up on unmount
    return () => {
      if (typeof window !== 'undefined') {
        // Only remove verification link, keep email in case user comes back
        localStorage.removeItem('verificationLink')
      }
    }
  }, [searchParams])
  
  // Set up countdown timer for auto-redirect
  useEffect(() => {
    if (verified && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (verified && countdown === 0) {
      redirectToDashboard()
    }
  }, [verified, countdown])
  
  const redirectToDashboard = () => {
    const dashboardPath = role === "student" 
      ? "/student/dashboard" 
      : role === "mentor" 
        ? "/mentor/dashboard" 
        : "/admin/dashboard"
    
    router.push(dashboardPath)
  }
  
  const handleVerifyClick = async () => {
    setLoading(true)
    setError("")
    
    try {
      if (magicLink) {
        // Use the magic link directly
        window.location.href = magicLink
        return
      }
      
      // If we don't have a magic link stored, request a new one
      const response = await fetch('/api/auth/force-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify email')
      }
      
      if (data.success) {
        // If we got a magic link, use it
        if (data.signInLink) {
          window.location.href = data.signInLink
          return
        }
        
        // Otherwise, show success and prepare for redirection
        setVerified(true)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify email')
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
          <h2 className="text-3xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="mt-2 text-sm text-gray-600">
            Complete your email verification to access your account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{verified ? "Email Verified!" : "Almost There!"}</CardTitle>
            <CardDescription>
              {verified 
                ? "Your email has been verified successfully." 
                : `We need to verify your email (${email || "your account"})`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {verified ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <h3 className="text-lg font-medium">Verification Complete!</h3>
                <p>
                  You will be redirected to your dashboard in {countdown} seconds...
                </p>
                <Button 
                  onClick={redirectToDashboard} 
                  className="w-full"
                >
                  Go to Dashboard Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm text-blue-700">
                        Please check your email inbox for a verification link, or click the button below to get a verification link.
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleVerifyClick} 
                  disabled={loading} 
                  className="w-full"
                >
                  {loading 
                    ? "Processing..." 
                    : magicLink 
                      ? "Click to Verify Email" 
                      : "Send Verification Link"}
                </Button>
                
                <div className="text-center">
                  <Link 
                    href="/auth/login" 
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}