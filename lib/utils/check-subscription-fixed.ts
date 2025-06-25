import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export type SubscriptionFeature = 
  | 'mentor_meetings'
  | 'test_analysis'
  | 'resources'
  | 'on_request_meetings'
  | 'custom_study_plans';

/**
 * Check if a user has access to a specific premium feature
 * @param userId The user ID to check
 * @param feature The feature to check access for
 * @returns Boolean indicating if the user has access
 */
export async function checkFeatureAccess(
  userId: string,
  feature: SubscriptionFeature
): Promise<boolean> {
  const supabase = createServerClient();
  
  // Call the database function to check access
  const { data, error } = await supabase.rpc('has_premium_access', {
    p_student_id: userId,
    p_feature: feature
  });
  
  if (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
  
  return !!data;
}

/**
 * Middleware to check if a user has access to a specific feature
 * @param req The Next.js request
 * @param feature The feature to check access for
 * @returns NextResponse with redirect if no access, or null to continue
 */
export async function checkSubscriptionAccess(
  req: NextRequest,
  feature: SubscriptionFeature
): Promise<NextResponse | null> {
  const supabase = createServerClient();
  
  // Get user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Not logged in, redirect to login
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
  
  // Check if user has access to the feature
  const hasAccess = await checkFeatureAccess(session.user.id, feature);
  
  if (!hasAccess) {
    // No access, redirect to pricing page
    return NextResponse.redirect(new URL('/pricing?access=denied', req.url));
  }
  
  // User has access, continue
  return null;
}

/**
 * Increment meeting usage for a user
 * @param userId The user ID
 * @param meetingType The type of meeting ('regular' or 'on_request')
 * @returns Boolean indicating if the increment was successful
 */
export async function incrementMeetingUsage(
  userId: string,
  meetingType: 'regular' | 'on_request'
): Promise<boolean> {
  const supabase = createServerClient();
  
  // Call the database function to increment usage
  const { data, error } = await supabase.rpc('increment_meeting_usage', {
    p_student_id: userId,
    p_meeting_type: meetingType
  });
  
  if (error) {
    console.error('Error incrementing meeting usage:', error);
    return false;
  }
  
  return !!data;
}

/**
 * Get the current subscription plan for a user
 * @param userId The user ID
 * @returns The current plan and expiration date
 */
export async function getCurrentPlan(userId: string): Promise<{
  plan: 'free' | 'pro' | 'premium';
  expiresAt: Date | null;
  meetingsUsed: number;
  onRequestUsed: number;
} | null> {
  const supabase = createServerClient();
  
  // Get student data
  const { data, error } = await supabase
    .from('students')
    .select('plan, plan_end_date, meetings_used, on_request_used')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    console.error('Error getting current plan:', error);
    return null;
  }
  
  return {
    plan: data.plan as 'free' | 'pro' | 'premium',
    expiresAt: data.plan_end_date ? new Date(data.plan_end_date) : null,
    meetingsUsed: data.meetings_used,
    onRequestUsed: data.on_request_used
  };
}