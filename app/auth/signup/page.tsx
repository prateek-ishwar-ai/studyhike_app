"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen } from "lucide-react"
import { shouldUsePasswordAuth, isAppDomain } from "@/lib/utils/app-utils"
import AppSignupPage from "@/components/auth/app-signup"

// Import Supabase client info
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseCredentials = !!supabaseUrl && !!supabaseAnonKey

type UserRole = "student" | "mentor" | "admin"

export default function SignUpPage() {
  // Check if this should be the app version
  const [isAppVersion, setIsAppVersion] = useState(false)

  useEffect(() => {
    // Detect if we should show app version
    const useAppVersion = shouldUsePasswordAuth() || isAppDomain()
    setIsAppVersion(useAppVersion)
  }, [])

  // If this is the app version, render the app-specific signup
  if (isAppVersion) {
    return <AppSignupPage />
  }

  // Otherwise, render the regular website signup
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [detectedRole, setDetectedRole] = useState<UserRole | null>(null)

  const { signUp } = useAuth()
  const router = useRouter()
  
  // Automatically detect role based on email
  const determineRole = (email: string): UserRole => {
    // Predefined role mappings (these are examples, adjust as needed)
    if (email.includes('mentor') || email.includes('teacher') || email.endsWith('.edu')) {
      return 'mentor';
    } else if (email.includes('admin')) {
      return 'admin';
    } else {
      return 'student'; // Default role
    }
  }

  // Update detected role when email changes
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (newEmail) {
      setDetectedRole(determineRole(newEmail));
    } else {
      setDetectedRole(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    // Basic validation
    if (!email || !password || !fullName) {
      setError("Please fill in all fields")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }
    
    // Determine the role based on email
    const role = determineRole(email);
    console.log(`Auto-detected role for ${email}: ${role}`);

    try {
      // Use our enhanced signUp method that returns success/error
      const result = await signUp(email, password, fullName, role)
      
      if (!result.success) {
        throw new Error(result.error || "Failed to create account")
      }
      
      setSuccess(true)

      // If there's a warning/info message, show it, but still consider it a success
      if (result.error) {
        setError(result.error)
      }

      // Show success message and redirect
      // If email confirmation is required, the user will be instructed
      // Otherwise, they will be redirected
      if (!result.error?.includes("email")) {
        setTimeout(() => {
          // Redirect to the appropriate dashboard based on detected role
          const redirectPath = role === "student" 
            ? "/student/dashboard" 
            : role === "mentor" 
              ? "/mentor/dashboard" 
              : "/admin/dashboard";
          
          router.push(redirectPath);
        }, 1500)
      }
    } catch (error: any) {
      console.error("Signup error:", error)

      // Handle specific error cases
      if (error.message?.includes("User already registered") || 
          error.message?.includes("already registered")) {
        setError("An account with this email already exists. Please sign in instead.")
      } else if (error.message?.includes("Invalid email")) {
        setError("Please enter a valid email address")
      } else if (error.message?.includes("Password")) {
        setError("Password must be at least 6 characters long")
      } else if (error.message?.includes("not available")) {
        // Fallback for when Supabase is not configured
        setError("Authentication service is currently unavailable. Please try again later.")
      } else {
        setError(error.message || "Failed to create account. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0C0E19] via-[#111420] to-[#0C0E19] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-3 mb-6">
            <div className="bg-orange-500 p-2 rounded-lg">
              <span role="img" aria-label="bulb" className="text-xl">💡</span>
            </div>
            <div>
              <span className="text-2xl font-bold text-orange-500">StudyHike</span>
              <p className="text-sm text-gray-400">Clarity Over Chaos. Calm Over Pressure.</p>
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-white">Create your account</h2>
          <p className="mt-2 text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium text-yellow-400 hover:text-yellow-300">
              Sign in here
            </Link>
          </p>
        </div>

        <Card className="bg-[#1F2937] border-gray-600">
          <CardHeader>
            <CardTitle className="text-white">Get started today</CardTitle>
            <CardDescription className="text-gray-400">Create your account to begin your StudyHike journey</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 text-green-800 border-green-200">
                  <AlertDescription>
                    Account created successfully! {hasSupabaseCredentials ? 
                      "Please check your email for a confirmation link before logging in." : 
                      "Redirecting..."}
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="fullName" className="text-gray-300">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="mt-1 bg-[#374151] border-gray-600 text-white placeholder-gray-400"
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-300">Email address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  className="mt-1 bg-[#374151] border-gray-600 text-white placeholder-gray-400"
                  placeholder="Enter your email"
                  disabled={loading}
                />
                {email && detectedRole && (
                  <div className="mt-1 text-sm text-gray-400">
                    You will be registered as a <span className="font-semibold capitalize text-yellow-400">{detectedRole}</span>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-300">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 bg-[#374151] border-gray-600 text-white placeholder-gray-400"
                  placeholder="Create a password (min 6 characters)"
                  minLength={6}
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-300 text-[#0C0E19] font-bold" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>

              <div className="text-center">
                <p className="text-xs text-gray-400">
                  By creating an account, you agree to our{" "}
                  <Link href="/terms" className="text-yellow-400 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-yellow-400 hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
