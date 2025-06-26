"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Smartphone, Eye, EyeOff, Check } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

export default function AppSignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [role, setRole] = useState("student")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { profile, user } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      const dashboardPath = profile.role === "student" 
        ? "/student/dashboard" 
        : profile.role === "mentor" 
          ? "/mentor/dashboard" 
          : "/admin/dashboard"
      router.push(dashboardPath)
    }
  }, [user, profile, router])

  // Handle signup (APP VERSION - PASSWORD ONLY)
  const signUpWithPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password || !confirmPassword || !fullName) {
      setError("Please fill in all fields")
      return
    }

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
      setSuccess(false)
      
      // Store role in localStorage
      localStorage.setItem('userRole', role)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          }
        }
      })
      
      if (error) {
        throw error
      }
      
      if (data.user) {
        // For app version, we'll handle this differently
        // Check if email confirmation is required
        if (!data.session) {
          // Email confirmation required
          setSuccess(true)
          setError("")
        } else {
          // Immediate login (session created)
          const dashboardPath = role === 'student' 
            ? '/student/dashboard' 
            : role === 'mentor' 
              ? '/mentor/dashboard' 
              : '/admin/dashboard'
          
          router.push(dashboardPath)
        }
      }
      
    } catch (err: any) {
      console.error("Signup error:", err)
      
      if (err.message?.includes("User already registered")) {
        setError("An account with this email already exists. Please try signing in instead.")
      } else if (err.message?.includes("Invalid email")) {
        setError("Please enter a valid email address.")
      } else if (err.message?.includes("Password should be at least 6 characters")) {
        setError("Password must be at least 6 characters long.")
      } else {
        setError(err.message || "Failed to create account")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C0E19] via-[#111420] to-[#0C0E19] px-4 py-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Mobile App Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-3 rounded-xl shadow-lg">
              <span role="img" aria-label="bulb" className="text-2xl">💡</span>
            </div>
            <div>
              <span className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">StudyHike</span>
              <p className="text-sm text-gray-400">Mobile App</p>
            </div>
          </Link>
          
          <div className="flex items-center justify-center space-x-2 mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Smartphone className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">Native App Experience</span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            Create Account
          </h2>
          <p className="text-sm text-gray-400">
            Join StudyHike and start your learning journey
          </p>
        </div>

        {/* Main Signup Form */}
        <Card className="bg-[#1F2937] border-gray-600 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">Sign Up</CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              Create your StudyHike account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Role Selection */}
            <Tabs defaultValue="student" className="mb-6" onValueChange={setRole}>
              <TabsList className="grid grid-cols-3 w-full h-12">
                <TabsTrigger value="student" className="text-xs font-medium">Student</TabsTrigger>
                <TabsTrigger value="mentor" className="text-xs font-medium">Mentor</TabsTrigger>
                <TabsTrigger value="admin" className="text-xs font-medium">Admin</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Display */}
            {success && (
              <Alert className="bg-green-900/50 text-green-100 border-green-500/50 mb-4">
                <AlertDescription className="flex items-start">
                  <Check className="h-5 w-5 mr-2 mt-0.5 text-green-400" />
                  <div className="flex-1">
                    Account created successfully! Please check your email and click the verification link to complete your registration.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Signup Form */}
            <form onSubmit={signUpWithPassword} className="space-y-4">
              {/* Full Name Input */}
              <div>
                <Label htmlFor="fullName" className="text-gray-300 text-sm font-medium">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="mt-2 bg-[#374151] border-gray-600 text-white placeholder-gray-400 h-12 text-base focus:border-yellow-500 focus:ring-yellow-500"
                  placeholder="Enter your full name"
                  disabled={loading || success}
                />
              </div>

              {/* Email Input */}
              <div>
                <Label htmlFor="email" className="text-gray-300 text-sm font-medium">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-2 bg-[#374151] border-gray-600 text-white placeholder-gray-400 h-12 text-base focus:border-yellow-500 focus:ring-yellow-500"
                  placeholder="Enter your email"
                  disabled={loading || success}
                />
              </div>

              {/* Password Input */}
              <div>
                <Label htmlFor="password" className="text-gray-300 text-sm font-medium">Password</Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-[#374151] border-gray-600 text-white placeholder-gray-400 pr-12 h-12 text-base focus:border-yellow-500 focus:ring-yellow-500"
                    placeholder="Create a password"
                    disabled={loading || success}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Must be at least 6 characters</p>
              </div>

              {/* Confirm Password Input */}
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-300 text-sm font-medium">Confirm Password</Label>
                <div className="relative mt-2">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-[#374151] border-gray-600 text-white placeholder-gray-400 pr-12 h-12 text-base focus:border-yellow-500 focus:ring-yellow-500"
                    placeholder="Confirm your password"
                    disabled={loading || success}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                disabled={loading || !email || !password || !confirmPassword || !fullName || success}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating account...
                  </div>
                ) : success ? (
                  "Account Created! Check Email"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <span className="text-gray-400 text-sm">Already have an account? </span>
              <Link 
                href="/auth/login" 
                className="text-yellow-500 hover:text-yellow-400 text-sm font-medium"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}