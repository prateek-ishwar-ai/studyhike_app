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
import { Smartphone, Eye, EyeOff, Check, Fingerprint } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

// Biometric auth hook (will be created)
const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    checkBiometricAvailability()
  }, [])

  const checkBiometricAvailability = async () => {
    try {
      // Check if we're in a native app environment
      if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
        // Simple check for mobile device
        setIsAvailable(true)
        setIsEnabled(localStorage.getItem('biometric_enabled') === 'true')
      }
    } catch (error) {
      console.log('Biometric not available:', error)
      setIsAvailable(false)
    }
  }

  const authenticate = async () => {
    try {
      // For web demo, we'll simulate biometric auth
      // In real app, this would use @capacitor-community/fingerprint-auth
      const confirmed = window.confirm('Place your finger on the fingerprint sensor')
      if (confirmed) {
        return { success: true }
      }
      return { success: false, error: 'Authentication cancelled' }
    } catch (error) {
      return { success: false, error: 'Biometric authentication failed' }
    }
  }

  const enableBiometric = () => {
    localStorage.setItem('biometric_enabled', 'true')
    setIsEnabled(true)
  }

  const disableBiometric = () => {
    localStorage.removeItem('biometric_enabled')
    setIsEnabled(false)
  }

  return {
    isAvailable,
    isEnabled,
    authenticate,
    enableBiometric,
    disableBiometric
  }
}

export default function AppLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [role, setRole] = useState("student")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const { profile, user } = useAuth()
  const router = useRouter()
  const biometric = useBiometricAuth()

  // Check for saved credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('app_saved_email')
    const savedRole = localStorage.getItem('app_saved_role')
    
    if (savedEmail) {
      setEmail(savedEmail)
    }
    if (savedRole) {
      setRole(savedRole)
    }

    // If biometric is enabled and we have saved credentials, show biometric option
    if (biometric.isEnabled && savedEmail) {
      // Auto-focus on biometric auth
      console.log('Biometric auth available for saved user')
    }
  }, [biometric.isEnabled])

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

  // Handle biometric authentication
  const handleBiometricAuth = async () => {
    try {
      setLoading(true)
      setError("")

      const savedEmail = localStorage.getItem('app_saved_email')
      const savedPassword = localStorage.getItem('app_saved_password') // Encrypted in real app

      if (!savedEmail || !savedPassword) {
        setError("No saved credentials found. Please login with password first.")
        return
      }

      const biometricResult = await biometric.authenticate()
      
      if (biometricResult.success) {
        // Use saved credentials to sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: savedEmail,
          password: savedPassword,
        })

        if (error) {
          throw error
        }

        if (data.user) {
          const dashboardPath = role === 'student' 
            ? '/app/student' 
            : role === 'mentor' 
              ? '/app/mentor' 
              : '/app/admin'
          
          router.push(dashboardPath)
        }
      } else {
        setError(biometricResult.error || "Biometric authentication failed")
      }
    } catch (err: any) {
      console.error("Biometric auth error:", err)
      setError(err.message || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  // Handle password login (APP VERSION - NO MAGIC LINK)
  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }
    
    try {
      setLoading(true)
      setError("")
      
      // Store role in localStorage
      localStorage.setItem('userRole', role)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        throw error
      }
      
      if (data.user) {
        // Save credentials for future biometric auth (if remember me is checked)
        if (rememberMe) {
          localStorage.setItem('app_saved_email', email)
          localStorage.setItem('app_saved_role', role)
          // Note: In production, password should be encrypted or use secure storage
          localStorage.setItem('app_saved_password', password)
          
          // Ask user if they want to enable biometric auth
          if (biometric.isAvailable && !biometric.isEnabled) {
            const enableBio = window.confirm('Enable fingerprint/biometric authentication for faster login?')
            if (enableBio) {
              biometric.enableBiometric()
            }
          }
        }

        // Success - redirect to dashboard
        const dashboardPath = role === 'student' 
          ? '/app/student' 
          : role === 'mentor' 
            ? '/app/mentor' 
            : '/app/admin'
        
        router.push(dashboardPath)
      }
      
    } catch (err: any) {
      console.error("Password login error:", err)
      
      if (err.message?.includes("Invalid login credentials")) {
        setError("Incorrect email or password. Please try again.")
      } else if (err.message?.includes("Email not confirmed")) {
        setError("Please verify your email first. Check your inbox for verification link.")
      } else {
        setError(err.message || "Failed to sign in")
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
            Welcome Back
          </h2>
          <p className="text-sm text-gray-400">
            Sign in to continue your learning journey
          </p>
        </div>

        {/* Biometric Auth Section */}
        {biometric.isEnabled && biometric.isAvailable && localStorage.getItem('app_saved_email') && (
          <Card className="bg-[#1F2937] border-gray-600 shadow-xl">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mb-4">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Fingerprint className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h3 className="text-white font-medium mb-2">Quick Login</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Use your fingerprint to sign in as {localStorage.getItem('app_saved_email')}
                </p>
                <Button 
                  onClick={handleBiometricAuth}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 text-white font-bold h-12"
                >
                  {loading ? "Authenticating..." : "Use Fingerprint"}
                </Button>
                <p className="text-center text-gray-400 text-sm mt-4">
                  or sign in with password below
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Login Form */}
        <Card className="bg-[#1F2937] border-gray-600 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">Sign In</CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              Enter your credentials to access your account
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

            {/* Login Form */}
            <form onSubmit={signInWithPassword} className="space-y-4">
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
                  disabled={loading}
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

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-yellow-500 bg-[#374151] border-gray-600 rounded focus:ring-yellow-500"
                />
                <Label htmlFor="remember" className="text-gray-300 text-sm">
                  Remember me for biometric login
                </Label>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                disabled={loading || !email || !password}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <Link 
                href="/auth/forgot-password" 
                className="text-yellow-500 hover:text-yellow-400 text-sm font-medium"
              >
                Forgot your password?
              </Link>
            </div>
            
            <div className="mt-4 text-center">
              <span className="text-gray-400 text-sm">Don't have an account? </span>
              <Link 
                href="/auth/signup" 
                className="text-yellow-500 hover:text-yellow-400 text-sm font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}