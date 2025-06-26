import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database"

// Get environment variables with fallbacks for build process
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// Check if we have the required environment variables (excluding placeholders)
const hasSupabaseCredentials = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') && 
  !supabaseAnonKey.includes('placeholder')
)

// Create a browser client
let supabase = null;

// Initialize Supabase client only on the client side and when credentials are available
if (typeof window !== "undefined" && hasSupabaseCredentials) {
  try {
    console.log("Initializing Supabase client with URL:", supabaseUrl);
    
    // Always try to create the client with available credentials
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storageKey: 'supabase.auth.token',
        detectSessionInUrl: true,
        flowType: 'pkce', // Changed from 'implicit' to 'pkce' for better security and reliability
        skipVerificationCheck: true
      },
      global: {
        fetch: (...args) => {
          // Function to perform fetch with retry logic
          const fetchWithRetry = (retryCount = 0, maxRetries = 2) => {
            return new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                console.warn('Supabase request is taking longer than expected...');
              }, 20000); // 20 second warning
              
              const hardTimeout = setTimeout(() => {
                clearTimeout(timeout);
                
                if (retryCount < maxRetries) {
                  console.log(`Request timed out, retrying (${retryCount + 1}/${maxRetries})...`);
                  clearTimeout(hardTimeout);
                  fetchWithRetry(retryCount + 1, maxRetries)
                    .then(resolve)
                    .catch(reject);
                } else {
                  reject(new Error(`Request timed out after ${retryCount + 1} attempts`));
                }
              }, 30000); // 30 second hard timeout
              
              fetch(...args)
                .then(response => {
                  clearTimeout(timeout);
                  clearTimeout(hardTimeout);
                  resolve(response);
                })
                .catch(error => {
                  clearTimeout(timeout);
                  clearTimeout(hardTimeout);
                  
                  if (retryCount < maxRetries) {
                    console.log(`Request failed, retrying (${retryCount + 1}/${maxRetries})...`, error);
                    fetchWithRetry(retryCount + 1, maxRetries)
                      .then(resolve)
                      .catch(reject);
                  } else {
                    console.error('Fetch error after max retries:', error);
                    reject(error);
                  }
                });
            });
          };
          
          return fetchWithRetry();
        }
      }
    });
    
    // Clear any demo mode flags that might be set
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('demo_student_mode');
      localStorage.removeItem('demo_mentor_mode');
    }
    
    // Set up listener for auth state change events
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('access_token') || searchParams.has('refresh_token')) {
      console.log("Detected auth tokens in URL, handling auth redirect...");
    }
    
    // Test the connection with improved error handling
    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error getting session:", error);
          // Log detailed error information for debugging
          if (error.message) {
            console.error("Error message:", error.message);
          }
          if (error.status) {
            console.error("Error status:", error.status);
          }
          // Don't throw here, just log the error
        } else {
          console.log("Supabase client initialized successfully");
          if (data && data.session) {
            console.log("User is authenticated");
          } else {
            console.log("No active session found");
          }
        }
      })
      .catch(error => {
        console.error("Failed to get session:", error);
        // Check for network-related errors
        if (error.message && (
          error.message.includes('timeout') || 
          error.message.includes('network') ||
          error.message.includes('fetch')
        )) {
          console.error("Network error detected. Please check your internet connection.");
        }
        // Handle network errors gracefully
      });
  } catch (error) {
    console.error("Error initializing Supabase client:", error);
    supabase = null;
  }
} else if (typeof window !== "undefined") {
  console.warn("Supabase credentials not available or are placeholders. Using mock client for development.");
}

// Always create a fallback client for server-side rendering or when credentials are missing
if (!supabase) {
  supabase = {
      auth: {
        getUser: async () => ({ data: { user: { id: 'demo-user-' + Date.now() } }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signIn: async () => ({ data: { user: { id: 'demo-user-' + Date.now() } }, error: null }),
        signUp: async () => ({ data: { user: { id: 'demo-user-' + Date.now() } }, error: null }),
        signOut: async () => ({ error: null })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: null }),
            limit: async () => ({ data: [], error: null }),
            order: () => ({
              limit: async () => ({ data: [], error: null })
            })
          }),
          limit: async () => ({ data: [], error: null }),
          order: () => ({
            limit: async () => ({ data: [], error: null })
          }),
          gt: () => ({
            order: () => ({
              limit: async () => ({ data: [], error: null })
            })
          }),
          gte: () => ({
            lte: async () => ({ data: [], error: null })
          })
        }),
        insert: async () => ({ data: { id: 'demo-id-' + Date.now() }, error: null }),
        update: async () => ({ data: null, error: null }),
        delete: async () => ({ data: null, error: null })
      }),
      rpc: () => ({ error: null })
    } as any;
}

export { supabase, hasSupabaseCredentials };

export function getSupabaseClient() {
  if (!supabase) {
    console.error("Supabase client not initialized. Please check your environment variables.");
    return null;
  }
  
  // Initialize storage buckets if they don't exist
  initializeStorageBuckets(supabase);
  
  return supabase;
}

async function initializeStorageBuckets(supabaseClient: any) {
  if (!supabaseClient) return;
  
  try {
    // Check if homework_submissions bucket exists
    const { data: buckets, error } = await supabaseClient.storage.listBuckets();
    
    if (error) {
      console.error("Error checking storage buckets:", error);
      return;
    }
    
    const requiredBuckets = ['homework-submissions', 'mentor-feedback'];
    const existingBuckets = buckets.map(bucket => bucket.name);
    
    for (const bucketName of requiredBuckets) {
      if (!existingBuckets.includes(bucketName)) {
        console.log(`Creating storage bucket: ${bucketName}`);
        
        // Create the bucket
        const { error: createError } = await supabaseClient.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
        });
        
        if (createError) {
          console.error(`Error creating ${bucketName} bucket:`, createError);
        } else {
          console.log(`Successfully created ${bucketName} bucket`);
        }
      }
    }
  } catch (error) {
    console.error("Error initializing storage buckets:", error);
  }
}
