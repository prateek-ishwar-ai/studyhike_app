"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  // This function will determine where to redirect the user
  const redirectToDashboard = () => {
    // Check for stored role
    const storedRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null
    
    // Default to student if no role is stored
    const userRole = storedRole || 'student'
    
    // Determine dashboard path
    const dashboardPath = userRole === 'student' 
      ? '/student/dashboard' 
      : userRole === 'mentor' 
        ? '/mentor/dashboard' 
        : '/admin/dashboard'
    
    // Store that we're recently verified to prevent unnecessary redirects
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('recently_verified', 'true')
      sessionStorage.setItem('auth_redirecting', 'true')
      
      // Also set a redirect flag with timestamp to prevent loops
      sessionStorage.setItem('magic_link_redirect', Date.now().toString())
    }
    
    // Redirect to the dashboard
    window.location.href = dashboardPath
  }
  
  // Immediately process auth and redirect on page load
  useEffect(() => {
    const processAuthAndRedirect = async () => {
      try {
        console.log("Auth callback page loaded, processing authentication...")
        
        // Check if this is a mobile app callback
        const urlParams = new URLSearchParams(window.location.search)
        const isMobileCallback = urlParams.get('mode') === 'mobile'
        
        if (isMobileCallback) {
          console.log("Mobile app magic link callback detected")
        }
        
        // If we already have a user from context, redirect immediately
        if (user) {
          console.log("User already authenticated in context, redirecting...")
          redirectToDashboard()
          return
        }
        
        // Get the hash fragment from the URL
        const hash = window.location.hash
        
        // Check for auth data in the hash
        if (hash && hash.includes('access_token')) {
          console.log("Found access token in URL, confirming session...")
          
          // For mobile app, we need to handle the magic link differently
          if (isMobileCallback) {
            // Wait a bit longer for mobile session confirmation
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          
          // Get session from Supabase auth API
          const { data } = await supabase.auth.getSession()
          
          if (data.session) {
            console.log("Session confirmed, redirecting to dashboard...")
            // We have a session, redirect to dashboard
            redirectToDashboard()
            return
          }
        }
        
        // If we're still here, we should check if auth is in progress
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          console.log("Session found, redirecting to dashboard...")
          redirectToDashboard()
          return
        }
        
        // For mobile app, try to get session one more time with delay
        if (isMobileCallback) {
          console.log("Mobile app - trying to get session again...")
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          const { data: { session: finalSession } } = await supabase.auth.getSession()
          if (finalSession) {
            console.log("Mobile session confirmed on retry, redirecting...")
            redirectToDashboard()
            return
          }
        }
        
        // Last resort - if we still don't have a session, redirect to login
        console.log("No session found, redirecting to login...")
        window.location.href = '/auth/login'
      } catch (err) {
        console.error("Error in auth callback:", err)
        // On any error, redirect to login
        window.location.href = '/auth/login'
      }
    }
    
    // Execute immediately
    processAuthAndRedirect()
  }, [user])
  
  // No UI needed - this page should redirect immediately
  return null
}