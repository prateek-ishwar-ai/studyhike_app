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
import { BookOpen, Mail, ArrowRight, Smartphone, Eye, EyeOff, Check } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useIsMobile } from "@/hooks/use-mobile"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [role, setRole] = useState("student")
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState("")
  const [authMode, setAuthMode] = useState<'magic' | 'password'>('password')
  const [showPassword, setShowPassword] = useState(false)

  const { profile, user } = useAuth()
  const router = useRouter()
  const isMobile = useIsMobile()

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile) {
      // User is already logged in, redirect to the appropriate dashboard
      if (profile.role === "student") {
        router.push("/student/dashboard")
      } else if (profile.role === "mentor") {
        router.push("/mentor/dashboard")
      } else if (profile.role === "admin") {
        router.push("/admin/dashboard")
      }
    }
  }, [user, profile, router])

  // Function for password login
  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }
    
    try {
      setLoading(true)
      setError("")
      setSuccess(false)
      setMessage("")
      
      // Store role in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('userRole', role)
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        throw error
      }
      
      if (data.user) {
        // Success - redirect to dashboard
        const dashboardPath = role === 'student' 
          ? '/student/dashboard' 
          : role === 'mentor' 
            ? '/mentor/dashboard' 
            : '/admin/dashboard'
        
        router.push(dashboardPath)
      }
      
    } catch (err: any) {
      console.error("Password login error:", err)
      
      if (err.message?.includes("Invalid login credentials")) {
        setError("Incorrect email or password. Please try again.")
      } else if (err.message?.includes("Email not confirmed")) {
        setError("Please check your email and click the verification link before signing in.")
      } else {
        setError(err.message || "Failed to sign in")
      }
    } finally {
      setLoading(false)
    }
  }

  // Function to send magic link (for mobile app users)
  const sendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError("Please enter your email address")
      return
    }
    
    try {
      setLoading(true)
      setError("")
      setSuccess(false)
      setMessage("")
      
      // Store role in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('userRole', role)
      }
      
      // For mobile app, we need to handle the magic link differently
      const redirectTo = isMobile 
        ? `${window.location.origin}/auth/callback?mode=mobile`
        : `${window.location.origin}/auth/callback`

      // Request magic link from Supabase
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        }
      })
      
      if (error) {
        throw error
      }
      
      setSuccess(true)
      if (isMobile) {
        setMessage("Magic link sent! When you tap the link in your email, it will open directly in this app.")
      } else {
        setMessage("Magic link sent! Check your email inbox and click the link to sign in.")
      }
      
    } catch (err: any) {
      console.error("Magic link error:", err)
      
      // Show a user-friendly error
      if (err.message?.includes("unable to validate email address")) {
        setError("Invalid email address. Please check and try again.")
      } else {
        setError(err.message || "Failed to send magic link")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#0C0E19] via-[#111420] to-[#0C0E19] ${isMobile ? 'px-4 py-6' : 'flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'}`}>
      <div className={`${isMobile ? 'w-full' : 'max-w-md w-full'} space-y-6`}>
        {/* Mobile App Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-3 rounded-xl shadow-lg">
              <span role="img" aria-label="bulb" className="text-2xl">💡</span>
            </div>
            <div>
              <span className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">StudyHike</span>
              <p className="text-sm text-gray-400">Your Study Companion</p>
            </div>
          </Link>
          
          {isMobile && (
            <div className="flex items-center justify-center space-x-2 mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Smartphone className="h-5 w-5 text-blue-400" />
              <span className="text-sm text-blue-400 font-medium">Mobile App Experience</span>
            </div>
          )}
          
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-white mb-2`}>
            Welcome Back
          </h2>
          <p className="text-sm text-gray-400">
            Sign in to continue your learning journey
          </p>
        </div>

        {/* Role Selection - Mobile Optimized */}
        <Card className="bg-[#1F2937] border-gray-600 shadow-xl">
          <CardHeader className={`${isMobile ? 'pb-4' : 'pb-6'}`}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white text-lg">Choose Your Role</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  Select how you'll be using StudyHike
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Tabs defaultValue="student" className="mb-6" onValueChange={setRole}>
              <TabsList className={`grid grid-cols-3 w-full ${isMobile ? 'h-12' : 'h-10'}`}>
                <TabsTrigger value="student" className="text-xs font-medium">Student</TabsTrigger>
                <TabsTrigger value="mentor" className="text-xs font-medium">Mentor</TabsTrigger>
                <TabsTrigger value="admin" className="text-xs font-medium">Admin</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Auth Mode Toggle - Mobile First */}
            <div className="flex items-center justify-center mb-6">
              <div className="bg-[#374151] p-1 rounded-lg flex">
                <button
                  type="button"
                  onClick={() => setAuthMode('password')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    authMode === 'password' 
                      ? 'bg-yellow-500 text-black' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('magic')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    authMode === 'magic' 
                      ? 'bg-yellow-500 text-black' 
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Magic Link
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription className="flex items-start">
                  <div className="flex-1">
                    {error}
                    {authMode === 'password' && (
                      <div className="mt-3">
                        <button 
                          onClick={() => setAuthMode('magic')}
                          className="text-blue-400 hover:text-blue-300 hover:underline text-sm"
                        >
                          Try magic link instead
                        </button>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Success Display */}
            {success && (
              <Alert className="bg-green-900/50 text-green-100 border-green-500/50 mb-4">
                <AlertDescription className="flex items-start">
                  <Check className="h-5 w-5 mr-2 mt-0.5 text-green-400" />
                  <div className="flex-1">
                    {message}
                    {authMode === 'magic' && (
                      <p className="mt-2 text-sm text-green-200">
                        Don't see it? Check your spam folder or{" "}
                        <button 
                          onClick={(e) => sendMagicLink(e)} 
                          className="text-green-400 hover:underline font-medium">
                          try again
                        </button>
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={authMode === 'password' ? signInWithPassword : sendMagicLink} className="space-y-4">
              {/* Email Input */}
              <div>
                <Label htmlFor="email" className="text-gray-300 text-sm font-medium">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`mt-2 bg-[#374151] border-gray-600 text-white placeholder-gray-400 ${
                    isMobile ? 'h-12 text-base' : 'h-10'
                  } focus:border-yellow-500 focus:ring-yellow-500`}
                  placeholder="Enter your email"
                  disabled={loading || success}
                />
              </div>

              {/* Password Input - Only for password mode */}
              {authMode === 'password' && (
                <div>
                  <Label htmlFor="password" className="text-gray-300 text-sm font-medium">Password</Label>
                  <div className="relative mt-2">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`bg-[#374151] border-gray-600 text-white placeholder-gray-400 pr-12 ${
                        isMobile ? 'h-12 text-base' : 'h-10'
                      } focus:border-yellow-500 focus:ring-yellow-500`}
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className={`w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold transition-all duration-200 ${
                  isMobile ? 'h-12 text-base' : 'h-11'
                } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl`}
                disabled={loading || (!email || (authMode === 'password' && !password)) || success}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    {authMode === 'password' ? 'Signing in...' : 'Sending magic link...'}
                  </div>
                ) : (
                  <span className="flex items-center justify-center">
                    {authMode === 'password' ? 'Sign In' : 'Send Magic Link'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
            
            {/* Footer Links */}
            <div className="text-center mt-6 pt-4 border-t border-gray-600">
              <div className="flex flex-col space-y-3">
                <Link 
                  href="/auth/signup" 
                  className="text-sm text-yellow-400 hover:text-yellow-300 hover:underline font-medium"
                >
                  Don't have an account? Sign up
                </Link>
                
                {authMode === 'password' && (
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm text-gray-400 hover:text-gray-300 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
