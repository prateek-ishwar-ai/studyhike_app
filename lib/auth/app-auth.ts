// Enhanced authentication utilities for mobile app
import { supabase } from "@/lib/supabase/client"
import { BiometricAuth } from "@/lib/utils/app-utils"

export interface AppAuthState {
  isLoggedIn: boolean
  user: any
  profile: any
  biometricEnabled: boolean
  autoLoginAttempted: boolean
}

// Session persistence utilities
export const SessionManager = {
  // Check for existing session on app startup
  checkExistingSession: async (): Promise<AppAuthState> => {
    try {
      // First check localStorage for quick initialization
      const storedUser = localStorage.getItem('mark240_user')
      const storedProfile = localStorage.getItem('mark240_profile')
      const biometricEnabled = BiometricAuth.isEnabled()

      let quickState: AppAuthState = {
        isLoggedIn: false,
        user: null,
        profile: null,
        biometricEnabled,
        autoLoginAttempted: false
      }

      // Set initial state from localStorage if available
      if (storedUser && storedProfile) {
        try {
          quickState.user = JSON.parse(storedUser)
          quickState.profile = JSON.parse(storedProfile)
          quickState.isLoggedIn = true
        } catch (e) {
          console.warn("Failed to parse stored auth data")
        }
      }

      // Then verify with Supabase
      if (supabase) {
        const { data, error } = await supabase.auth.getSession()
        
        if (data.session && data.session.user) {
          // Session is valid
          return {
            ...quickState,
            isLoggedIn: true,
            user: data.session.user,
            autoLoginAttempted: true
          }
        } else if (error) {
          console.error("Session verification failed:", error)
          // Clear invalid session data
          localStorage.removeItem('mark240_user')
          localStorage.removeItem('mark240_profile')
        }
      }

      return {
        ...quickState,
        autoLoginAttempted: true
      }
    } catch (error) {
      console.error("Error checking existing session:", error)
      return {
        isLoggedIn: false,
        user: null,
        profile: null,
        biometricEnabled: BiometricAuth.isEnabled(),
        autoLoginAttempted: true
      }
    }
  },

  // Save session data
  saveSession: (user: any, profile: any) => {
    try {
      localStorage.setItem('mark240_user', JSON.stringify(user))
      localStorage.setItem('mark240_profile', JSON.stringify(profile))
    } catch (error) {
      console.error("Failed to save session:", error)
    }
  },

  // Clear session data
  clearSession: () => {
    localStorage.removeItem('mark240_user')
    localStorage.removeItem('mark240_profile')
    localStorage.removeItem('app_saved_email')
    localStorage.removeItem('app_saved_password')
    localStorage.removeItem('app_saved_role')
    BiometricAuth.disable()
  },

  // Auto-login with biometric
  attemptBiometricLogin: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!BiometricAuth.isEnabled()) {
        return { success: false, error: "Biometric auth not enabled" }
      }

      const savedEmail = localStorage.getItem('app_saved_email')
      const savedPassword = localStorage.getItem('app_saved_password')

      if (!savedEmail || !savedPassword) {
        return { success: false, error: "No saved credentials" }
      }

      // Authenticate with biometric
      const biometricResult = await BiometricAuth.authenticate("Unlock StudyHike")
      
      if (!biometricResult.verified) {
        return { success: false, error: "Biometric authentication failed" }
      }

      // Sign in with saved credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: savedEmail,
        password: savedPassword,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        return { success: true }
      }

      return { success: false, error: "Login failed" }
    } catch (error) {
      return { success: false, error: error.message }
    }
  },

  // Enhanced sign-in with biometric option
  signInWithPassword: async (
    email: string, 
    password: string, 
    rememberMe: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        // Save credentials for biometric auth if requested
        if (rememberMe) {
          localStorage.setItem('app_saved_email', email)
          localStorage.setItem('app_saved_password', password) // In production, encrypt this
          
          // Ask about biometric if available and not enabled
          if (await BiometricAuth.isAvailable() && !BiometricAuth.isEnabled()) {
            // This would be handled by the UI component
          }
        }

        return { success: true }
      }

      return { success: false, error: "Login failed" }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }
}

// App-specific authentication hooks
export const useAppAuth = () => {
  // This would be implemented as a React hook in a real app
  // For now, return the utilities
  return {
    SessionManager,
    BiometricAuth
  }
}