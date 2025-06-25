"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, Calendar, CheckCircle, AlertCircle, Video, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { DashboardCard, DashboardContentCard } from "@/components/ui/dashboard-card"
import { SkeletonCard, SkeletonContentCard } from "@/components/ui/skeleton-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { UpcomingSessionsCard } from "@/components/ui/upcoming-sessions-card"
import { MentorStudents } from "@/components/dashboard/mentor-students"
import { motion } from "framer-motion"
import { ProgressiveLoading, ProgressiveLoadingContainer } from "@/components/ui/progressive-loading"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface MentorStats {
  totalStudents: number;
  activeStudents: number;
  pendingHomework: number;
  sessionsToday: number;
  upcomingSessions: number;
  completedThisWeek: number;
}

interface Activity {
  id: string;
  type: "homework" | "session";
  student: string;
  subject: string;
  action: string;
  time: string;
}

interface SessionItem {
  id: string;
  student: string;
  subject: string;
  time: string;
  status: string;
}

export default function MentorDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<MentorStats>({
    totalStudents: 0,
    activeStudents: 0,
    pendingHomework: 0,
    sessionsToday: 0,
    upcomingSessions: 0,
    completedThisWeek: 0,
  });

  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [todaysSessions, setTodaysSessions] = useState<SessionItem[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Track loading state for each section
  const [sectionLoading, setSectionLoading] = useState({
    stats: true,
    sessions: true,
    activity: true
  });

  // Make sure we're on the client side and initialize with cached data if available
  useEffect(() => {
    setMounted(true);
    
    // Try to load cached data for immediate display
    if (typeof window !== 'undefined') {
      try {
        const cachedStats = localStorage.getItem('mentor_dashboard_stats');
        const cachedSessions = localStorage.getItem('mentor_dashboard_sessions');
        const cachedActivity = localStorage.getItem('mentor_dashboard_activity');
        
        if (cachedStats) {
          setStats(JSON.parse(cachedStats));
          setSectionLoading(prev => ({ ...prev, stats: false }));
        }
        
        if (cachedSessions) {
          const sessions = JSON.parse(cachedSessions);
          setTodaysSessions(sessions.today || []);
          setUpcomingSessions(sessions.upcoming || []);
          setSectionLoading(prev => ({ ...prev, sessions: false }));
        }
        
        if (cachedActivity) {
          setRecentActivity(JSON.parse(cachedActivity));
          setSectionLoading(prev => ({ ...prev, activity: false }));
        }
        
        // If we have all cached data, set loading to false
        if (cachedStats && cachedSessions && cachedActivity) {
          setLoading(false);
        }
      } catch (e) {
        console.warn("Error loading cached dashboard data:", e);
      }
    }
  }, []);

  // Check if user is authorized to view this page
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (authLoading || !mounted || sessionStorage.getItem('auth_redirecting')) {
      return;
    }
    
    // Reduce auth check frequency to prevent blinking
    const authAttemptTime = localStorage.getItem('authAttemptTime');
    const now = Date.now();
    
    if (authAttemptTime && (now - parseInt(authAttemptTime)) < 10000) {
      console.log("Recent auth attempt, waiting for auth state to settle");
      return;
    }
    
    // Only redirect if we're certain the user is not authenticated
    if (!user && !authLoading && mounted) {
      console.log("No user found, redirecting to login");
      sessionStorage.setItem('auth_redirecting', 'true');
      router.push('/auth/login');
      return;
    }

    if (profile && profile.role !== 'mentor' && !authLoading && mounted) {
      console.log("User is not a mentor, redirecting");
      sessionStorage.setItem('auth_redirecting', 'true');
      router.push('/student/dashboard');
      return;
    }

    // Clear any redirect flags
    sessionStorage.removeItem('auth_redirecting');
  }, [user, profile, authLoading, mounted, router]);

  // Fetch mentor dashboard data
  useEffect(() => {
    if (!user || !profile || profile.role !== 'mentor') return;

    // Check if Supabase client is available
    if (!supabase) {
      console.error('Supabase client not initialized');
      setError('Database connection error. Please try again later.');
      setLoading(false);
      return;
    }
    
    // Add a network status check
    if (!navigator.onLine) {
      console.error('Network is offline');
      setError('You appear to be offline. Please check your internet connection and try again.');
      setLoading(false);
      return;
    }

    // Helper function to retry Supabase queries
    async function retryQuery(queryFn, maxRetries = 2) {
      let lastError = null;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`Retry attempt ${attempt}/${maxRetries}...`);
            // Add a small delay between retries
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
          
          return await queryFn();
        } catch (error) {
          console.error(`Query failed (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
          lastError = error;
          
          // If this is the last attempt, we'll throw the error
          if (attempt === maxRetries) {
            throw error;
          }
        }
      }
    }
    
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // Set up progressive loading
        setSectionLoading({
          stats: true,
          sessions: true,
          activity: true
        });
        
        // Fetch mentor's students from assigned_students
        let allStudents = [];
        let totalStudentsCount = 0;
        
        try {
          const result = await retryQuery(async () => {
            // Use a simpler query without relying on foreign key relationships
            const { data, error } = await supabase
              .from('assigned_students')
              .select('student_id')
              .eq('mentor_id', user.id);
              
            if (error) {
              throw error; // This will trigger a retry
            }
            
            // If we have students, get their profile information separately
            if (data && data.length > 0) {
              const studentIds = data.map(s => s.student_id);
              
              // Get profiles for these students
              const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', studentIds);
                
              if (profilesError) {
                throw profilesError;
              }
              
              // Combine the data
              const combinedData = data.map(student => {
                const profile = profilesData.find(p => p.id === student.student_id);
                return {
                  student_id: student.student_id,
                  profiles: profile ? { full_name: profile.full_name, email: profile.email } : null
                };
              });
              
              return { data: combinedData };
            }
            
            return { data: [] };
          });
          
          if (result && result.data) {
            allStudents = result.data || [];
            totalStudentsCount = allStudents.length;
            console.log(`Found ${totalStudentsCount} assigned students`);
          }
        } catch (fetchError) {
          console.error('Exception fetching assigned students:', 
            JSON.stringify(fetchError, null, 2),
            fetchError
          );
          setError(`Failed to load students: ${fetchError.message || 'Connection error'}`);
        }
        
        // Verify count from database
        try {
          const { count: dbCount, error: countError } = await supabase
            .from('assigned_students')
            .select('student_id', { count: 'exact', head: true })
            .eq('mentor_id', user.id);
            
          if (countError) {
            console.error('Error getting student count:', countError);
          } else {
            const dbTotalCount = dbCount || 0;
            console.log(`Database count of assigned students: ${dbTotalCount}`);
            
            // Use the database count if it's higher (more reliable)
            if (dbTotalCount > totalStudentsCount) {
              totalStudentsCount = dbTotalCount;
            }
          }
        } catch (countError) {
          console.error('Exception getting student count:', countError);
        }

        // Fetch pending homework for mentor's students
        const studentIds = allStudents.map(s => s.student_id) || [];
        let pendingHomeworkCount = 0;
        
        if (studentIds.length > 0) {
          try {
            const { data: homework, error: homeworkError } = await supabase
              .from('homework')
              .select('id')
              .in('student_id', studentIds)
              .eq('status', 'pending');

            if (!homeworkError) {
              pendingHomeworkCount = homework?.length || 0;
            } else {
              console.error('Error fetching homework:', homeworkError);
            }
          } catch (homeworkFetchError) {
            console.error('Exception fetching homework:', homeworkFetchError);
          }
        }

        // Fetch today's sessions
        const today = new Date().toISOString().split('T')[0];
        let sessions = [];
        
        try {
          const { data: sessionsData, error: sessionsError } = await supabase
            .from('sessions')
            .select('*')
            .eq('mentor_id', user.id)
            .gte('scheduled_at', today)
            .lt('scheduled_at', today + 'T23:59:59');
            
          if (sessionsError) {
            console.error('Error fetching today\'s sessions:', sessionsError);
          } else {
            sessions = sessionsData || [];
          }
        } catch (sessionsFetchError) {
          console.error('Exception fetching today\'s sessions:', sessionsFetchError);
          // Don't set error state for sessions - let dashboard load with empty sessions
        }

        // Fetch upcoming sessions (next 7 days)
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        let upcomingSessionsData = [];
        
        try {
          const result = await retryQuery(async () => {
            // Get sessions without the join
            const { data, error } = await supabase
              .from('sessions')
              .select('*')
              .eq('mentor_id', user.id)
              .gte('scheduled_at', new Date().toISOString())
              .lte('scheduled_at', nextWeek.toISOString())
              .order('scheduled_at', { ascending: true });
              
            if (error) {
              throw error; // This will trigger a retry
            }
            
            // If we have sessions, get the student profiles separately
            if (data && data.length > 0) {
              const studentIds = data.map(session => session.student_id);
              
              // Get profiles for these students
              const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', studentIds);
                
              if (profilesError) {
                throw profilesError;
              }
              
              // Combine the data
              const combinedData = data.map(session => {
                const profile = profilesData.find(p => p.id === session.student_id);
                return {
                  ...session,
                  profiles: profile ? { full_name: profile.full_name } : null
                };
              });
              
              return { data: combinedData };
            }
            
            return { data: [] };
          });
          
          if (result && result.data) {
            upcomingSessionsData = result.data || [];
          }
        } catch (upcomingFetchError) {
          console.error('Exception fetching upcoming sessions:', 
            JSON.stringify(upcomingFetchError, null, 2),
            upcomingFetchError
          );
          // Don't set error state for sessions - let dashboard load with empty sessions
        }
        
        // Get completed sessions this week
        let completedThisWeek = 0;
        try {
          const startOfWeek = new Date();
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of current week (Sunday)
          startOfWeek.setHours(0, 0, 0, 0);
          
          const { count, error: completedError } = await supabase
            .from('sessions')
            .select('id', { count: 'exact', head: true })
            .eq('mentor_id', user.id)
            .eq('status', 'completed')
            .gte('scheduled_at', startOfWeek.toISOString());
            
          if (!completedError) {
            completedThisWeek = count || 0;
          } else {
            console.error('Error fetching completed sessions:', completedError);
          }
        } catch (completedFetchError) {
          console.error('Exception fetching completed sessions:', completedFetchError);
        }

        setStats({
          totalStudents: totalStudentsCount || 0,
          activeStudents: allStudents?.length || 0,
          pendingHomework: pendingHomeworkCount,
          sessionsToday: sessions?.length || 0,
          upcomingSessions: upcomingSessionsData?.length || 0,
          completedThisWeek: completedThisWeek
        });
        
        // Mark stats as loaded - this will allow the UI to start rendering
        setSectionLoading(prev => ({
          ...prev,
          stats: false
        }));
        
        // Consider the dashboard partially loaded once stats are available
        setLoading(false);

        setUpcomingSessions(upcomingSessionsData || []);
        
        // Fetch real recent activity
        let homeworkData = [];
        let sessionsData = [];
        
        try {
          // Get recent homework submissions
          const result = await retryQuery(async () => {
            // Get homework without the join
            const { data, error } = await supabase
              .from('homework')
              .select('id, student_id, subject, created_at')
              .eq('mentor_id', user.id)
              .order('created_at', { ascending: false })
              .limit(5);
              
            if (error) {
              throw error; // This will trigger a retry
            }
            
            // If we have homework, get the student profiles separately
            if (data && data.length > 0) {
              const studentIds = data.map(hw => hw.student_id);
              
              // Get profiles for these students
              const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', studentIds);
                
              if (profilesError) {
                throw profilesError;
              }
              
              // Combine the data
              const combinedData = data.map(hw => {
                const profile = profilesData.find(p => p.id === hw.student_id);
                return {
                  ...hw,
                  profiles: profile ? { full_name: profile.full_name } : null
                };
              });
              
              return { data: combinedData };
            }
            
            return { data: [] };
          });
          
          if (result && result.data) {
            homeworkData = result.data || [];
          }
        } catch (homeworkFetchError) {
          console.error('Exception fetching recent homework:', 
            JSON.stringify(homeworkFetchError, null, 2),
            homeworkFetchError
          );
        }
        
        try {
          // Get recent sessions
          const result = await retryQuery(async () => {
            // Get sessions without the join
            const { data, error } = await supabase
              .from('sessions')
              .select('id, student_id, subject, scheduled_at, status')
              .eq('mentor_id', user.id)
              .order('scheduled_at', { ascending: false })
              .limit(5);
              
            if (error) {
              throw error; // This will trigger a retry
            }
            
            // If we have sessions, get the student profiles separately
            if (data && data.length > 0) {
              const studentIds = data.map(session => session.student_id);
              
              // Get profiles for these students
              const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', studentIds);
                
              if (profilesError) {
                throw profilesError;
              }
              
              // Combine the data
              const combinedData = data.map(session => {
                const profile = profilesData.find(p => p.id === session.student_id);
                return {
                  ...session,
                  profiles: profile ? { full_name: profile.full_name } : null
                };
              });
              
              return { data: combinedData };
            }
            
            return { data: [] };
          });
          
          if (result && result.data) {
            sessionsData = result.data || [];
          }
        } catch (sessionsFetchError) {
          console.error('Exception fetching recent sessions:', 
            JSON.stringify(sessionsFetchError, null, 2),
            sessionsFetchError
          );
        }
          
        // Combine and format the activity data
        const recentActivityData = [];
        
        // Add homework activities
        if (homeworkData && homeworkData.length > 0) {
          homeworkData.forEach(hw => {
            const timeDiff = new Date().getTime() - new Date(hw.created_at).getTime();
            const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
            const daysAgo = Math.floor(hoursAgo / 24);
            
            let timeText = 'just now';
            if (hoursAgo > 0 && hoursAgo < 24) {
              timeText = `${hoursAgo}h ago`;
            } else if (daysAgo > 0) {
              timeText = `${daysAgo}d ago`;
            }
            
            recentActivityData.push({
              id: hw.id,
              type: 'homework',
              student: hw.profiles?.full_name || 'Student',
              subject: hw.subject || 'Unknown',
              action: 'submitted homework',
              time: timeText
            });
          });
        }
        
        // Add session activities
        if (sessionsData && sessionsData.length > 0) {
          sessionsData.forEach(session => {
            const sessionDate = new Date(session.scheduled_at);
            const now = new Date();
            const isPast = sessionDate < now;
            
            const timeDiff = isPast 
              ? now.getTime() - sessionDate.getTime()
              : sessionDate.getTime() - now.getTime();
              
            const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
            const daysAgo = Math.floor(hoursAgo / 24);
            
            let timeText = isPast ? 'just now' : 'soon';
            if (hoursAgo > 0 && hoursAgo < 24) {
              timeText = isPast ? `${hoursAgo}h ago` : `in ${hoursAgo}h`;
            } else if (daysAgo > 0) {
              timeText = isPast ? `${daysAgo}d ago` : `in ${daysAgo}d`;
            }
            
            const action = isPast 
              ? session.status === 'completed' ? 'completed session' : 'missed session'
              : 'scheduled session';
            
            recentActivityData.push({
              id: session.id,
              type: 'session',
              student: session.profiles?.full_name || 'Student',
              subject: session.subject || 'Unknown',
              action,
              time: timeText
            });
          });
        }
        
        // Sort by most recent first (based on time field)
        recentActivityData.sort((a, b) => {
          // Extract numeric value from time strings
          const getTimeValue = (timeStr) => {
            if (timeStr === 'just now' || timeStr === 'soon') return 0;
            const match = timeStr.match(/(\d+)/);
            return match ? parseInt(match[1]) : 0;
          };
          
          const aValue = getTimeValue(a.time);
          const bValue = getTimeValue(b.time);
          
          // Compare "ago" vs "in" (past vs future)
          const aIsPast = a.time.includes('ago');
          const bIsPast = b.time.includes('ago');
          
          if (aIsPast && !bIsPast) return -1;
          if (!aIsPast && bIsPast) return 1;
          
          // For same direction (both past or both future)
          if (aIsPast && bIsPast) {
            // For "ago", smaller numbers are more recent
            return aValue - bValue;
          } else {
            // For "in", smaller numbers are sooner
            return aValue - bValue;
          }
          
          return 0;
        });
        
        // Take the most recent 5 activities
        const recentActivitySlice = recentActivityData.slice(0, 5);
        setRecentActivity(recentActivitySlice);
        
        // Cache the data for faster loading next time
        try {
          if (typeof window !== 'undefined') {
            // Cache stats
            localStorage.setItem('mentor_dashboard_stats', JSON.stringify({
              totalStudents: totalStudents || 0,
              activeStudents: activeStudents || 0,
              pendingHomework: pendingHomework || 0,
              sessionsToday: sessions.length || 0,
              upcomingSessions: sessionsData.length || 0,
              completedThisWeek: completedThisWeek || 0,
            }));
            
            // Cache sessions
            localStorage.setItem('mentor_dashboard_sessions', JSON.stringify({
              today: sessions.map(s => ({
                id: s.id,
                student: s.student_name || 'Student',
                subject: s.subject || 'General',
                time: s.scheduled_at || new Date().toISOString(),
                status: s.status || 'scheduled'
              })),
              upcoming: sessionsData.map(s => ({
                id: s.id,
                student: s.profiles?.full_name || 'Student',
                subject: s.subject || 'General',
                time: s.scheduled_at || new Date().toISOString(),
                status: s.status || 'scheduled'
              }))
            }));
            
            // Cache activity
            localStorage.setItem('mentor_dashboard_activity', JSON.stringify(recentActivitySlice));
          }
        } catch (cacheError) {
          console.warn('Error caching dashboard data:', cacheError);
          // Non-critical error, don't show to user
        }
      } catch (activityError) {
        console.error('Error processing activity data:', activityError);
        // Fallback to empty activity list
        setRecentActivity([]);
      }
    }

    // Execute the data fetching with additional error handling
    fetchDashboardData().catch(error => {
      console.error('Unhandled error in fetchDashboardData:', error);
      setError('An unexpected error occurred. Please try again later.');
      setLoading(false);
      setSectionLoading({
        stats: false,
        sessions: false,
        activity: false
      });
    });
  }, [user, profile]);

  if (!mounted) {
    return null;
  }

  if (authLoading) {
    return (
      <div className="container mx-auto py-10">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Mentor Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.full_name || 'Mentor'}
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      ) : (
        <ProgressiveLoadingContainer baseDelay={50} staggerDelay={200}>
          {/* Stats Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {sectionLoading.stats ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <DashboardCard
                  title="Total Students"
                  value={stats.totalStudents}
                  description={`${stats.activeStudents} active this month`}
                  icon={Users}
                />
                <DashboardCard
                  title="Pending Homework"
                  value={stats.pendingHomework}
                  description="Submissions to review"
                  icon={BookOpen}
                />
                <DashboardCard
                  title="Today's Sessions"
                  value={stats.sessionsToday}
                  description={`${stats.upcomingSessions} upcoming this week`}
                  icon={Calendar}
                />
                <DashboardCard
                  title="Completed This Week"
                  value={stats.completedThisWeek}
                  description="Sessions completed"
                  icon={CheckCircle}
                  trend={{
                    value: 12,
                    label: "from last week",
                    isPositive: true
                  }}
                />
              </>
            )}
          </div>

          {/* Recent Activity */}
          <div className="grid gap-6 md:grid-cols-2">
            {sectionLoading.activity ? (
              <SkeletonContentCard className="md:col-span-2" rows={4} />
            ) : (
              <DashboardContentCard
                title="Recent Activity"
                description="Latest student interactions and submissions"
                className="md:col-span-2"
                action={
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/mentor/activity">View All</Link>
                  </Button>
                }
              >
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0">
                          <div className={`rounded-full p-2 ${
                            activity.type === 'homework' 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'bg-green-50 text-green-600'
                          }`}>
                            {activity.type === 'homework' ? (
                              <BookOpen className="h-4 w-4" />
                            ) : (
                              <Video className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {activity.student}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.action} for {activity.subject}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <StatusBadge 
                            status={activity.action.includes('completed') ? 'completed' : 'pending'}
                            variant="dot"
                          >
                            {activity.time}
                          </StatusBadge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </DashboardContentCard>
            )}
          </div>

          {/* Upcoming Sessions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <CardDescription>
                  Your scheduled sessions for the next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UpcomingSessionsCard sessions={upcomingSessions} />
              </CardContent>
            </Card>
          </div>

          {/* Students Overview */}
          <div>
            <MentorStudents />
          </div>
        </ProgressiveLoadingContainer>
      )}
    </div>
  );
}
