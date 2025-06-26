import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database"

// Safe client initialization for production deployment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if we have real credentials (not placeholders)
const hasRealCredentials = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseAnonKey.includes('placeholder') &&
  supabaseUrl.includes('supabase.co') &&
  supabaseAnonKey.length > 50
)

// Initialize client only if we have real credentials
let supabase: any = null

if (typeof window !== "undefined" && hasRealCredentials) {
  try {
    console.log("✅ Initializing Supabase client with real credentials")
    supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storageKey: 'supabase.auth.token',
        detectSessionInUrl: true,
        flowType: 'pkce'
      }
    })
  } catch (error) {
    console.error("❌ Failed to initialize Supabase:", error)
    supabase = null
  }
}

// Create safe mock client for development/demo mode
if (!supabase) {
  console.warn("⚠️ Using demo mode - Supabase credentials not available or invalid")
  
  supabase = {
    auth: {
      getUser: async () => ({ 
        data: { user: null }, 
        error: null 
      }),
      getSession: async () => ({ 
        data: { session: null }, 
        error: null 
      }),
      signInWithPassword: async (credentials: any) => {
        // Demo mode - simulate successful login
        const mockUser = {
          id: 'demo-user-' + Date.now(),
          email: credentials.email,
          user_metadata: {
            full_name: credentials.email?.split('@')[0] || 'Demo User',
            role: localStorage.getItem('userRole') || 'student'
          }
        }
        
        return { 
          data: { user: mockUser, session: { user: mockUser } }, 
          error: null 
        }
      },
      signUp: async (credentials: any) => {
        // Demo mode - simulate successful signup
        const mockUser = {
          id: 'demo-user-' + Date.now(),
          email: credentials.email,
          user_metadata: {
            full_name: credentials.email?.split('@')[0] || 'Demo User'
          }
        }
        
        return { 
          data: { user: mockUser, session: null }, 
          error: null 
        }
      },
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => {
        return {
          data: { subscription: null },
          unsubscribe: () => {}
        }
      }
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          limit: async () => ({ data: [], error: null })
        }),
        limit: async () => ({ data: [], error: null })
      }),
      insert: async () => ({ data: null, error: null }),
      update: async () => ({ data: null, error: null }),
      delete: async () => ({ data: null, error: null })
    })
  }
}

export { supabase, hasRealCredentials }
export default supabase