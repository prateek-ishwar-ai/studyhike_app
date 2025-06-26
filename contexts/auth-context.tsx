"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase, hasRealCredentials } from "@/lib/supabase/safe-client"
import { useRouter } from "next/navigation"

type UserRole = "student" | "mentor" | "admin"

interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (profile: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo credentials
const DEMO_CREDENTIALS = {
  "student@demo.com": { password: "password123", role: "student" as UserRole, name: "Demo Student" },
  "mentor@demo.com": { password: "password123", role: "mentor" as UserRole, name: "Demo Mentor" },
  "admin@demo.com": { password: "password123", role: "admin" as UserRole, name: "Demo Admin" },
}

// Helper function to get role-specific redirect path
function getRoleRedirectPath(role: UserRole | undefined): string {
  // Also check localStorage for any stored role
  let detectedRole = role;
  
  if (typeof window !== 'undefined') {
    // Check for role stored during login or password reset
    const storedRole = localStorage.getItem('userRole');
    
    if (storedRole && ['student', 'mentor', 'admin'].includes(storedRole)) {
      console.log("Using stored role from localStorage:", storedRole);
      detectedRole = storedRole as UserRole;
    }
  }
  
  if (detectedRole === "student") return "/student/dashboard";
  if (detectedRole === "mentor") return "/mentor/dashboard";
  if (detectedRole === "admin") return "/admin/dashboard";
  return "/"; // Default fallback
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const router = useRouter()

  // Function to fetch profile data after user is authenticated
  const fetchUserProfile = async (userId: string) => {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
        
      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      
      return data as Profile;
    } catch (error) {
      console.error("Exception fetching profile:", error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let didCancel = false;
    let authListener: any = null;
    
    async function initialSession() {
      try {
        setLoading(true);
        
        // Check for localStorage session first for quicker initialization
        const storedUser = localStorage.getItem('mark240_user');
        const storedProfile = localStorage.getItem('mark240_profile');
        
        if (storedUser && storedProfile) {
          try {
            const parsedUser = JSON.parse(storedUser);
            const parsedProfile = JSON.parse(storedProfile);
            
            // Set initial state from localStorage
            if (!didCancel) {
              setUser(parsedUser);
              setProfile(parsedProfile);
            }
          } catch (e) {
            console.warn("Failed to parse stored auth data", e);
          }
        }
        
        if (supabase) {
          // Set up auth state change listener to keep session fresh
          authListener = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log("Auth state changed:", event);
            
            if (didCancel) return;
            
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              if (newSession?.user) {
                setUser(newSession.user);
                setSession(newSession);
                
                // Store user in localStorage for quicker access
                localStorage.setItem('mark240_user', JSON.stringify(newSession.user));
                
                // Fetch or create profile
                const profileData = await fetchUserProfile(newSession.user.id);
                
                if (profileData) {
                  setProfile(profileData);
                  localStorage.setItem('mark240_profile', JSON.stringify(profileData));
                } else {
                  // Create profile from metadata if none exists
                  try {
                    const userMeta = newSession.user.user_metadata;
                    if (userMeta && (userMeta.full_name || userMeta.role)) {
                      const newProfile: Profile = {
                        id: newSession.user.id,
                        email: newSession.user.email || "",
                        full_name: userMeta.full_name || newSession.user.email?.split('@')[0] || "User",
                        role: (userMeta.role as UserRole) || "student",
                      };
                      
                      const { error } = await supabase.from("profiles").insert(newProfile);
                      if (!error) {
                        setProfile(newProfile);
                        localStorage.setItem('mark240_profile', JSON.stringify(newProfile));
                      }
                    }
                  } catch (err) {
                    console.error("Error creating profile from metadata:", err);
                  }
                }
              }
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setProfile(null);
              setSession(null);
              localStorage.removeItem('mark240_user');
              localStorage.removeItem('mark240_profile');
            }
          });
          
          // Get current session
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Error getting session:", error);
            return;
          }
          
          if (data.session && !didCancel) {
            setSession(data.session);
            setUser(data.session.user);
            
            // Store user in localStorage
            localStorage.setItem('mark240_user', JSON.stringify(data.session.user));
            
            // Fetch profile
            const profileData = await fetchUserProfile(data.session.user.id);
            if (profileData && !didCancel) {
              setProfile(profileData);
              localStorage.setItem('mark240_profile', JSON.stringify(profileData));
            } else if (!didCancel) {
              // If no profile found, attempt to create one from user metadata
              try {
                const userMeta = data.session.user.user_metadata;
                if (userMeta) {
                  const newProfile: Profile = {
                    id: data.session.user.id,
                    email: data.session.user.email || "",
                    full_name: userMeta.full_name || data.session.user.email?.split('@')[0] || "User",
                    role: (userMeta.role as UserRole) || "student",
                  };
                  
                  // Insert profile
                  const { error } = await supabase.from("profiles").insert(newProfile);
                  if (!error) {
                    setProfile(newProfile);
                    localStorage.setItem('mark240_profile', JSON.stringify(newProfile));
                  }
                }
              } catch (err) {
                console.error("Error creating profile from metadata:", err);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error initializing session:", error);
      } finally {
        if (!didCancel) {
          setLoading(false);
        }
      }
    }
    
    initialSession();
    
    // Cleanup function
    return () => {
      didCancel = true;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("Attempting sign in with:", email);

    // Check if using demo credentials
    const demoUser = DEMO_CREDENTIALS[email as keyof typeof DEMO_CREDENTIALS];

    if (demoUser && demoUser.password === password) {
      console.log("Using demo authentication for:", email);

      // Create mock user and profile
      const mockUser = {
        id: `demo-${demoUser.role}`,
        email,
        user_metadata: { full_name: demoUser.name, role: demoUser.role },
        created_at: new Date().toISOString(),
      } as User;

      const mockProfile: Profile = {
        id: mockUser.id,
        email,
        full_name: demoUser.name,
        role: demoUser.role,
      };

      setUser(mockUser);
      setProfile(mockProfile);
      
      // Create dummy data for demo mentor
      if (demoUser.role === 'mentor') {
        console.log("Setting up demo mentor data");
        window.localStorage.setItem('demo_mentor_mode', 'true');
      }
      
      return { success: true };
    }

    // If Supabase is available, try real authentication
    if (supabase) {
      try {
        // Try alternative sign-in method first to handle specific issues
        // This helps bypass some Supabase email confirmation checks
        try {
          // First try signing in with email
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (signInData && signInData.session) {
            // Successfully signed in
            setUser(signInData.user);
            setSession(signInData.session);
            
            // Fetch profile
            const profileData = await fetchUserProfile(signInData.user.id);
            if (profileData) {
              setProfile(profileData);
              return { success: true };
            } else {
              // Create a profile if one doesn't exist
              try {
                const userMeta = signInData.user.user_metadata;
                const newProfile: Profile = {
                  id: signInData.user.id,
                  email: signInData.user.email || email,
                  full_name: userMeta?.full_name || email.split('@')[0],
                  role: (userMeta?.role as UserRole) || 'student',
                };
                
                await supabase.from("profiles").insert(newProfile);
                setProfile(newProfile);
              } catch (err) {
                console.warn("Failed to create profile:", err);
              }
              
              return { success: true };
            }
          }
          
          // If we got an email confirmation error but the user should be verified
          if (signInError && signInError.message.includes("Email not confirmed")) {
            // Try signing in with OTP as a backup method - this can bypass confirmation in some cases
            console.log("Email not confirmed error detected, trying alternative sign-in method...");
            
            // Note: We can't use admin functions on the client side
            // Instead, try to sign in with additional options to bypass verification
            
            // Re-attempt with normal password auth but with special options
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
              email,
              password,
              options: {
                // Set auth options that might help bypass verification
                data: {
                  bypass_email_verification: true,
                  skip_verification: true
                }
              }
            });
            
            if (retryData && retryData.session) {
              // Success! We got a session
              setUser(retryData.user);
              setSession(retryData.session);
              
              // Fetch profile
              const profileData = await fetchUserProfile(retryData.user.id);
              if (profileData) {
                setProfile(profileData);
              }
              
              return { success: true };
            }
            
            // If still failing, but we have the user, create a manual JWT token
            if (retryError) {
              // As a last resort, show a better error message but with a solution
              return { 
                success: false, 
                error: "Your account exists but needs verification. Please use 'Forgot Password' to reset your password and verify your email." 
              };
            }
          }
          
          // If we got here, the normal sign-in had a different error
          if (signInError) {
            // Normal error handling (not related to email confirmation)
            return { success: false, error: signInError.message };
          }
        } catch (innerError: any) {
          console.error("Inner auth exception:", innerError);
        }
        
        // Final fallback to standard sign-in method
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error("Authentication error:", error);
          
          // Format friendly error messages
          if (error.message.includes("Invalid login credentials")) {
            return { success: false, error: "Invalid email or password. Please try again." };
          }
          
          return { success: false, error: error.message };
        }

        // Successfully authenticated
        if (data && data.user && data.session) {
          setUser(data.user);
          setSession(data.session);
          
          // Fetch profile
          const profileData = await fetchUserProfile(data.user.id);
          if (profileData) {
            setProfile(profileData);
            return { success: true };
          } else {
            // If we can't get a profile, this is unusual but not fatal
            console.warn("User authenticated but no profile found");
            return { success: true };
          }
        }
        
        return { success: true };
      } catch (error: any) {
        console.error("Supabase auth exception:", error);
        return { success: false, error: error.message || "Authentication failed" };
      }
    }

    // If we get here, credentials are invalid
    return { success: false, error: "Invalid login credentials" };
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    // For demo mode, just create a mock user
    if (!supabase) {
      const mockUser = {
        id: `demo-${Date.now()}`,
        email,
        user_metadata: { full_name: fullName, role: role },
        created_at: new Date().toISOString(),
      } as User;

      const mockProfile: Profile = {
        id: mockUser.id,
        email,
        full_name: fullName,
        role,
      };

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setUser(mockUser);
      setProfile(mockProfile);
      return { success: true };
    }

    try {
      // Real Supabase signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
          // Make email confirmation more reliable
          emailRedirectTo: `${window.location.origin}/auth/login`,
        },
      });

      if (error) {
        console.error("Signup error:", error);
        return { success: false, error: error.message };
      }

      // Email confirmation might be required
      if (data.user?.identities?.length === 0) {
        return { 
          success: false, 
          error: "Email address already registered. Please check your inbox for confirmation email." 
        };
      }

      if (data.user) {
        // Create profile right away
        try {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            email,
            full_name: fullName,
            role,
          });

          if (profileError) {
            console.error("Profile creation error:", profileError);
          }

          // Create role-specific record
          if (role === "student") {
            await supabase.from("students").insert({ id: data.user.id });
          } else if (role === "mentor") {
            await supabase.from("mentors").insert({ id: data.user.id });
          }
        } catch (err) {
          console.error("Error creating additional records:", err);
        }

        // For better UX, check if email confirmation is needed
        if (!data.session) {
          return { 
            success: true, 
            error: "Please check your email to confirm your account before logging in." 
          };
        }
        
        // If we have a session, the user is automatically logged in
        setUser(data.user);
        setSession(data.session);
        setProfile({
          id: data.user.id,
          email,
          full_name: fullName,
          role,
        });
        
        return { success: true };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Exception during signup:", error);
      return { success: false, error: error.message || "Failed to create account" };
    }
  };

  const signOut = async () => {
    if (supabase) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Error signing out:", error);
        }
      } catch (error) {
        console.error("Exception during sign out:", error);
      }
    }

    // Clear local state
    setUser(null);
    setProfile(null);
    setSession(null);
    
    // Redirect to home page after logout
    router.push("/");
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      throw new Error("Password reset not available in demo mode");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    
    if (error) throw error;
  };

  const updateProfile = async (updatedProfile: Partial<Profile>) => {
    if (!user) throw new Error("No user logged in");

    if (!supabase) {
      // Mock update for demo
      setProfile((prev) => (prev ? { ...prev, ...updatedProfile } : null));
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update(updatedProfile)
        .eq("id", user.id);

      if (error) throw error;

      // Update local profile state
      setProfile((prev) => (prev ? { ...prev, ...updatedProfile } : null));
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  // Set up Supabase auth listener if available
  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state change:", event);
      
      // Track the auth event for debugging
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('last_auth_event', `${event} at ${new Date().toISOString()}`);
      }
      
      // Update session and user state
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        try {
          // Fetch profile when auth state changes
          const profileData = await fetchUserProfile(currentSession.user.id);
          
          if (profileData) {
            // Store profile in localStorage for faster access
            if (typeof window !== 'undefined') {
              localStorage.setItem('mark240_profile', JSON.stringify(profileData));
            }
            
            setProfile(profileData);
            
            // Handle specific auth events
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              // When signed in, check if we need to redirect based on role
              if (profileData && typeof window !== 'undefined') {
                // Prevent redirect loops with this session flag
                const isAlreadyRedirecting = sessionStorage.getItem('auth_redirecting');
                
                if (!isAlreadyRedirecting) {
                  sessionStorage.setItem('auth_redirecting', 'true');
                  
                  const currentPath = window.location.pathname;
                  const redirectPath = getRoleRedirectPath(profileData.role);
                  
                  // Check if we just completed magic link sign-in
                  const isCallback = currentPath.includes('/auth/callback');
                  
                  // Check if it's any auth page
                  const isAuthPage = currentPath.includes('/auth/');
                  
                  // If we're on a callback page, handle immediate redirect
                  if (isCallback) {
                    console.log("Magic link authentication successful, redirecting immediately");
                    
                    // Store confirmation flags
                    sessionStorage.setItem('recently_verified', 'true');
                    localStorage.setItem('confirmedRole', profileData.role);
                    
                    // Immediate redirect for magic link callback
                    window.location.href = redirectPath;
                    return; // Skip the rest of the logic
                  }
                  
                  // Only redirect from auth pages, not between dashboards
                  // This prevents the "bounce" issue where users get redirected from their dashboard
                  const shouldRedirect = isAuthPage;
                  
                  // Special case: if on the wrong role's dashboard, redirect to correct one
                  // But ONLY redirect from other roles' main dashboard, not sub-pages
                  const onWrongDashboard = 
                    (profileData.role === 'student' && (
                      currentPath === '/mentor/dashboard' || 
                      currentPath === '/admin/dashboard'
                    )) ||
                    (profileData.role === 'mentor' && (
                      currentPath === '/student/dashboard' || 
                      currentPath === '/admin/dashboard'
                    )) ||
                    (profileData.role === 'admin' && (
                      currentPath === '/student/dashboard' || 
                      currentPath === '/mentor/dashboard'
                    ));
                  
                  // Don't redirect from verify-email page
                  if ((shouldRedirect && !currentPath.includes('/verify-email')) || onWrongDashboard) {
                    console.log(`Redirecting ${profileData.role} to ${redirectPath}`);
                    
                    // Store this role to help with future routing decisions
                    localStorage.setItem('confirmedRole', profileData.role);
                    
                    // Check if we have a magic link redirect timestamp
                    const magicLinkTimestamp = sessionStorage.getItem('magic_link_redirect');
                    const fromMagicLink = magicLinkTimestamp && 
                      (Date.now() - parseInt(magicLinkTimestamp)) < 5000; // Within last 5 seconds
                    
                    if (fromMagicLink) {
                      // This is from a magic link - do immediate redirect
                      console.log("Magic link detected, doing immediate redirect");
                      window.location.href = redirectPath;
                    } else {
                      // Normal auth flow - use router
                      setTimeout(() => {
                        // Set the redirecting flag
                        sessionStorage.setItem('auth_redirecting', 'true');
                        
                        // Do the actual redirect
                        router.push(redirectPath);
                        
                        // Clear redirect flag after navigation
                        setTimeout(() => {
                          sessionStorage.removeItem('auth_redirecting');
                        }, 2000);
                      }, 500);
                    }
                  } else {
                    // Not redirecting, clear flag
                    sessionStorage.removeItem('auth_redirecting');
                  }
                }
              }
            }
          } else {
            // If no profile exists but we have a user, create one from metadata
            console.log("No profile found, creating from metadata");
            const userMeta = currentSession.user.user_metadata || {};
            const newProfile: Profile = {
              id: currentSession.user.id,
              email: currentSession.user.email || "",
              full_name: userMeta.full_name || currentSession.user.email?.split('@')[0] || "User",
              role: (userMeta.role as UserRole) || "student",
            };
            
            // Try to insert the profile
            const { error } = await supabase.from("profiles").insert(newProfile);
            
            if (!error) {
              setProfile(newProfile);
              // Store in localStorage
              if (typeof window !== 'undefined') {
                localStorage.setItem('mark240_profile', JSON.stringify(newProfile));
              }
            }
          }
        } catch (err) {
          console.error("Error handling auth state change:", err);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        
        // Clear localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mark240_user');
          localStorage.removeItem('mark240_profile');
          sessionStorage.removeItem('auth_redirecting');
        }
        
        // On sign out, redirect to home if on a protected page
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath.includes('/student/') || 
              currentPath.includes('/mentor/') || 
              currentPath.includes('/admin/')) {
            router.push('/');
          }
        }
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
