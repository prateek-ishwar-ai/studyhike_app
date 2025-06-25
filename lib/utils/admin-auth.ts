import { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

/**
 * Middleware function to check if the current user has admin access
 * @param supabase Supabase client instance
 * @returns The user object if admin, otherwise redirects
 */
export async function checkAdminAccess(supabase: SupabaseClient) {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Authentication error:', userError)
      redirect('/auth/login')
    }
    
    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.error('Profile error:', profileError)
      redirect('/auth/login')
    }
    
    // Check if user is an admin
    if (profile.role !== 'admin') {
      console.warn('Unauthorized access attempt to admin area by user:', user.id)
      redirect('/not-authorized')
    }
    
    return user
  } catch (error) {
    console.error('Error in checkAdminAccess:', error)
    redirect('/auth/login')
  }
}