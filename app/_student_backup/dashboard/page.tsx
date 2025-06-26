"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Calendar, TrendingUp, Target, Clock, CheckCircle, AlertCircle, MessageSquare, Lightbulb, Zap, Crown, ArrowRight, Play, Pause } from "lucide-react"
import { SubscriptionCard } from "@/components/ui/subscription-card"
import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton"
import { UpcomingMeetingsCard } from "@/components/ui/upcoming-meetings-card"
import { StudentMentor } from "@/components/dashboard/student-mentor"
import { motion } from "framer-motion"
import { ProgressiveLoading, ProgressiveLoadingContainer } from "@/components/ui/progressive-loading"
import { MobileAppLayout } from "@/components/ui/mobile-app-layout"
import { MobileNav, MobileQuickAction } from "@/components/ui/mobile-nav"
import { useIsMobile } from "@/hooks/use-mobile"

export default function StudentDashboard() {
  const [dashboardData, setDashboardData] = useState({
    todaysTasks: 0,
    completedTasks: 0,
    nextSession: null,
    upcomingSessions: [],
    upcomingMeetings: [],
    weeklyProgress: 0,
    studyStreak: 0,
    pendingHomework: [],
    recentTests: [],
    studentName: "",
    todaysStudyPlans: [], // Add this to store the actual study plans
    subscription: {
      plan: "free" as "free" | "pro" | "premium",
      expiresAt: null as Date | null,
      meetingsUsed: 0,
      onRequestUsed: 0,
      daysRemaining: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const isMobile = useIsMobile()
  
  // State for tracking loading status of different sections
  const [loadingStatus, setLoadingStatus] = useState({
    profile: true,
    tasks: true,
    sessions: true,
    meetings: true,
    homework: true,
    tests: true
  })
  
  // State for user ID
  const [userId, setUserId] = useState<string | null>(null)
  
  // Get user and profile data first, but optimize for performance
  useEffect(() => {
    // Try to load cached data for immediate display
    if (typeof window !== 'undefined') {
      try {
        const cachedDashboard = localStorage.getItem('student_dashboard_data');
        
        if (cachedDashboard) {
          const parsedData = JSON.parse(cachedDashboard);
          setDashboardData(parsedData);
          
          // Still show loading but with cached data visible
          setLoading(false);
          
          // Mark all sections as loaded from cache
          setLoadingStatus({
            profile: false,
            tasks: false,
            sessions: false,
            meetings: false,
            homework: false,
            tests: false
          });
        }
      } catch (e) {
        console.warn("Error loading cached dashboard data:", e);
      }
    }
    
    async function fetchUserData() {
      try {
        if (!supabase) {
          console.error("Supabase client not initialized")
          setLoading(false)
          return
        }

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          // Redirect to login if not authenticated
          router.push('/auth/login')
          return
        }

        setUserId(user.id)

        // Fetch profile and student data in parallel
        const [profileResult, studentResult] = await Promise.all([
          // Get profile data
          supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single(),
          
          // Get student data for streak and subscription
          supabase
            .from('students')
            .select('study_streak, plan, plan_start_date, plan_end_date, meetings_used, on_request_used')
            .eq('id', user.id)
            .single()
        ]);
        
        const profileData = profileResult.data;
        const studentData = studentResult.data;
        
        // After getting user data, fetch all dashboard data in parallel
        fetchAllDashboardData(user.id);
        
        // Calculate days remaining in subscription
        let daysRemaining = 0
        if (studentData?.plan_end_date) {
          const endDate = new Date(studentData.plan_end_date)
          const today = new Date()
          const diffTime = endDate.getTime() - today.getTime()
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          daysRemaining = Math.max(0, daysRemaining) // Ensure non-negative
          
          // If plan is expired and not free, update to free plan
          if (daysRemaining === 0 && studentData.plan !== 'free') {
            console.log("Subscription expired, downgrading to free plan")
            // Use fire-and-forget pattern for non-critical updates
            supabase
              .from('students')
              .update({ plan: 'free' })
              .eq('id', user.id)
              .then(() => console.log("Plan downgraded to free"))
              .catch(error => console.error("Error downgrading expired plan:", error))
                
            // Update local studentData immediately
            studentData.plan = 'free'
          }
        }
        
        // Update dashboard with initial data
        setDashboardData(prev => ({
          ...prev,
          studentName: profileData?.full_name || "Student",
          studyStreak: studentData?.study_streak || 0,
          subscription: {
            plan: studentData?.plan || "free",
            expiresAt: studentData?.plan_end_date ? new Date(studentData.plan_end_date) : null,
            meetingsUsed: studentData?.meetings_used || 0,
            onRequestUsed: studentData?.on_request_used || 0,
            daysRemaining: daysRemaining
          }
        }))
        
        setLoadingStatus(prev => ({
          ...prev,
          profile: false
        }))
        
        // Start fetching all other data immediately
        fetchAllDashboardData(user.id);
        
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoadingStatus(prev => ({
          ...prev,
          profile: false
        }))
      }
    }

    fetchUserData()
  }, [router, supabase])
  
  // Function to fetch all dashboard data in parallel
  async function fetchAllDashboardData(userId: string) {
    if (!userId || !supabase) return;
    
    try {
      console.time('fetchAllDashboardData');
      
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Calculate week range
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday
      
      const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
      const endOfWeekStr = endOfWeek.toISOString().split('T')[0];
      
      // Fetch all data in parallel
      const [
        studyPlansResult,
        weeklyPlansResult,
        sessionsResult,
        meetingsResult,
        homeworkResult,
        testsResult
      ] = await Promise.all([
        // Today's study plans
        supabase
          .from('study_plans')
          .select('*')
          .eq('student_id', userId)
          .eq('date', todayStr),
          
        // Weekly study plans
        supabase
          .from('study_plans')
          .select('*')
          .eq('student_id', userId)
          .gte('date', startOfWeekStr)
          .lte('date', endOfWeekStr),
          
        // Upcoming sessions
        supabase
          .from('sessions')
          .select('*, mentors:mentor_id(full_name)')
          .eq('student_id', userId)
          .gte('scheduled_date', todayStr)
          .order('scheduled_date', { ascending: true })
          .order('start_time', { ascending: true })
          .limit(5),
          
        // Upcoming meetings
        supabase
          .from('meeting_requests')
          .select('*, mentors:accepted_by(full_name)')
          .eq('student_id', userId)
          .eq('status', 'accepted')
          .order('scheduled_time', { ascending: true })
          .limit(5),
          
        // Pending homework
        supabase
          .from('homework')
          .select('*')
          .eq('student_id', userId)
          .in('status', ['assigned', 'in_progress'])
          .order('due_date', { ascending: true })
          .limit(5),
          
        // Recent tests
        supabase
          .from('tests')
          .select('*')
          .eq('student_id', userId)
          .order('date', { ascending: false })
          .limit(3)
      ]);
      
      // Process results
      const studyPlans = studyPlansResult.data || [];
      const weeklyPlans = weeklyPlansResult.data || [];
      const sessions = sessionsResult.data || [];
      const meetings = meetingsResult.data || [];
      const homework = homeworkResult.data || [];
      const tests = testsResult.data || [];
      
      // Calculate weekly progress
      const totalWeeklyTasks = weeklyPlans.length;
      const completedWeeklyTasks = weeklyPlans.filter(plan => plan.completed).length;
      const weeklyProgress = totalWeeklyTasks > 0 
        ? Math.round((completedWeeklyTasks / totalWeeklyTasks) * 100) 
        : 0;
      
      // Find the next session
      const nextSession = sessions.length > 0 ? sessions[0] : null;
      
      // Update all dashboard data at once
      setDashboardData(prev => ({
        ...prev,
        todaysTasks: studyPlans.length,
        completedTasks: studyPlans.filter(plan => plan.completed).length,
        weeklyProgress: weeklyProgress,
        todaysStudyPlans: studyPlans,
        nextSession: nextSession,
        upcomingSessions: sessions,
        upcomingMeetings: meetings,
        pendingHomework: homework,
        recentTests: tests
      }));
      
      // Mark all sections as loaded
      setLoadingStatus({
        profile: false,
        tasks: false,
        sessions: false,
        meetings: false,
        homework: false,
        tests: false
      });
      
      // Cache the dashboard data for faster loading next time
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('student_dashboard_data', JSON.stringify(dashboardData));
        }
      } catch (cacheError) {
        console.warn('Error caching dashboard data:', cacheError);
        // Non-critical error, don't show to user
      }
      
      // Set overall loading to false
      setLoading(false);
      
      console.timeEnd('fetchAllDashboardData');
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      
      // Mark all sections as loaded even on error
      setLoadingStatus({
        profile: false,
        tasks: false,
        sessions: false,
        meetings: false,
        homework: false,
        tests: false
      });
      
      // Set overall loading to false
      setLoading(false);
    }
  }

  // Fetch today's tasks and weekly progress - kept for backward compatibility
  useEffect(() => {
    // Skip this effect as we're now using fetchAllDashboardData
    return;
    
    async function fetchTasksData() {
      if (!userId) return
      
      try {
        console.log("Fetching tasks data for student:", userId)
        const today = new Date()
        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()]
        
        // Get today's study plans
        const { data: studyPlans, error: plansError } = await supabase
          .from('study_plans')
          .select('*')
          .eq('student_id', userId)
          .eq('day_of_week', dayOfWeek)
        
        if (plansError) {
          console.error("Error fetching study plans:", plansError)
          throw plansError
        }
        
        console.log("Retrieved study plans:", studyPlans?.length || 0)
        
        // Calculate weekly progress
        const startOfWeek = new Date(today)
        startOfWeek.setDate(today.getDate() - today.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(startOfWeek.getDate() + 6)
        endOfWeek.setHours(23, 59, 59, 999)
        
        const { data: weeklyPlans, error: weeklyPlansError } = await supabase
          .from('study_plans')
          .select('*')
          .eq('student_id', userId)
          .gte('created_at', startOfWeek.toISOString())
          .lte('created_at', endOfWeek.toISOString())
        
        if (weeklyPlansError) {
          console.error("Error fetching weekly plans:", weeklyPlansError)
          throw weeklyPlansError
        }
        
        console.log("Retrieved weekly plans:", weeklyPlans?.length || 0)
        
        // Calculate completed tasks
        const completedTasks = (studyPlans || []).filter(plan => plan.is_completed).length
        const totalTasks = (studyPlans || []).length
        
        // Calculate weekly progress
        const weeklyCompletedTasks = (weeklyPlans || []).filter(plan => plan.is_completed).length
        const weeklyTotalTasks = (weeklyPlans || []).length
        const weeklyProgress = weeklyTotalTasks > 0 ? (weeklyCompletedTasks / weeklyTotalTasks) * 100 : 0
        
        console.log("Tasks stats:", {
          todaysTasks: totalTasks,
          completedTasks: completedTasks,
          weeklyProgress: weeklyProgress,
          studyPlans: studyPlans?.length || 0
        })
        
        // Store the actual study plans for today
        setDashboardData(prev => ({
          ...prev,
          todaysTasks: totalTasks,
          completedTasks: completedTasks,
          weeklyProgress: weeklyProgress,
          todaysStudyPlans: studyPlans || [] // Store the actual study plans
        }))
      } catch (error) {
        console.error("Error in fetchTasksData:", error)
      } finally {
        setLoadingStatus(prev => ({
          ...prev,
          tasks: false
        }))
      }
    }
    
    fetchTasksData()
  }, [userId, supabase])
  
  // Fetch upcoming meeting requests - kept for backward compatibility
  useEffect(() => {
    // Skip this effect as we're now using fetchAllDashboardData
    return;
    
    async function fetchMeetingsData() {
      if (!userId) return
      
      try {
        console.log("Fetching meeting requests data for student:", userId)
        
        // Get meeting requests
        const { data: meetings, error: meetingsError } = await supabase
          .from('meeting_requests')
          .select('*')
          .eq('student_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)
          
        console.log("Meeting requests query result:", { meetings, error: meetingsError });
        
        if (meetingsError) {
          console.error("Error fetching meeting requests:", meetingsError)
          throw meetingsError
        }
        
        console.log("Retrieved meeting requests:", meetings?.length || 0)
        
        setDashboardData(prev => ({
          ...prev,
          upcomingMeetings: meetings || []
        }))
      } catch (error) {
        console.error("Error in fetchMeetingsData:", error)
      } finally {
        setLoadingStatus(prev => ({
          ...prev,
          meetings: false,
          sessions: false // Mark sessions as loaded too since we're not using them anymore
        }))
      }
    }
    
    fetchMeetingsData()
  }, [userId, supabase])
  
  // Fetch homework
  useEffect(() => {
    async function fetchHomeworkData() {
      if (!userId) return
      
      try {
        console.log("Fetching homework data for student:", userId)
        
        // Get pending homework
        const { data: homeworks, error: homeworkError } = await supabase
          .from('homework')
          .select('*')
          .eq('student_id', userId)
          .eq('status', 'pending')
          .order('due_date', { ascending: true })
        
        if (homeworkError) {
          console.error("Error fetching homework:", homeworkError)
          throw homeworkError
        }
        
        console.log("Retrieved pending homework:", homeworks?.length || 0)
        
        // Format pending homework
        const formattedHomework = homeworks?.map(hw => {
          const dueDate = new Date(hw.due_date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const tomorrow = new Date(today)
          tomorrow.setDate(today.getDate() + 1)
          
          const isToday = dueDate.toDateString() === today.toDateString()
          const isTomorrow = dueDate.toDateString() === tomorrow.toDateString()
          const isOverdue = dueDate < today
          
          let dueText = isToday ? 'Today' : (isTomorrow ? 'Tomorrow' : new Date(hw.due_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          }))
          
          return {
            id: hw.id,
            title: hw.title,
            subject: hw.subject,
            dueDate: dueText,
            isOverdue: isOverdue,
            isToday: isToday
          }
        }) || []
        
        console.log("Formatted homework items:", formattedHomework.length)
        
        setDashboardData(prev => ({
          ...prev,
          pendingHomework: formattedHomework
        }))
      } catch (error) {
        console.error("Error in fetchHomeworkData:", error)
      } finally {
        setLoadingStatus(prev => ({
          ...prev,
          homework: false
        }))
      }
    }
    
    fetchHomeworkData()
  }, [userId, supabase])
  
  // Fetch tests - kept for backward compatibility
  useEffect(() => {
    // Skip this effect as we're now using fetchAllDashboardData
    return;
    
    async function fetchTestsData() {
      if (!userId) return
      
      try {
        console.log("Fetching test data for student:", userId)
        
        // Get recent tests
        const { data: tests, error: testsError } = await supabase
          .from('tests')
          .select('*')
          .eq('student_id', userId)
          .order('test_date', { ascending: false })
          .limit(3)
        
        if (testsError) {
          console.error("Error fetching tests:", testsError)
          throw testsError
        }
        
        console.log("Retrieved recent tests:", tests?.length || 0)
        
        // Transform data for dashboard
        const formattedTests = tests?.map(test => ({
          id: test.id,
          subject: test.subject,
          score: test.score,
          maxScore: test.max_score,
          date: new Date(test.test_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        })) || []
        
        console.log("Formatted test items:", formattedTests.length)
        
        setDashboardData(prev => ({
          ...prev,
          recentTests: formattedTests
        }))
      } catch (error) {
        console.error("Error in fetchTestsData:", error)
      } finally {
        setLoadingStatus(prev => ({
          ...prev,
          tests: false
        }))
        
        // All data has been loaded
        console.log("All student dashboard data loaded")
      }
    }
    
    fetchTestsData()
  }, [userId, supabase])
  
  // Function to mark a study plan as completed
  const markPlanCompleted = async (planId: string) => {
    if (!userId || !planId) return;
    
    try {
      // Update the plan in the database
      const { error } = await supabase
        .from('study_plans')
        .update({ is_completed: true })
        .eq('id', planId)
        .eq('student_id', userId);
        
      if (error) {
        console.error("Error marking plan as completed:", error);
        return;
      }
      
      // Update local state
      setDashboardData(prev => {
        // Update the specific plan
        const updatedPlans = prev.todaysStudyPlans.map(plan => 
          plan.id === planId ? { ...plan, is_completed: true } : plan
        );
        
        // Count completed tasks
        const completedCount = updatedPlans.filter(plan => plan.is_completed).length;
        
        return {
          ...prev,
          todaysStudyPlans: updatedPlans,
          completedTasks: completedCount
        };
      });
      
      // This will trigger the study streak update via the useEffect
    } catch (error) {
      console.error("Error in markPlanCompleted:", error);
    }
  };
  
  // Function to update study streak
  const updateStudyStreak = async () => {
    if (!userId) return;
    
    try {
      // Check if user has completed any tasks today
      const hasCompletedTasksToday = dashboardData.completedTasks > 0;
      
      if (hasCompletedTasksToday) {
        // Get current streak
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('study_streak, last_activity_date')
          .eq('id', userId)
          .single();
          
        if (studentError) {
          console.error("Error fetching student data for streak update:", studentError);
          return;
        }
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let newStreak = studentData?.study_streak || 0;
        const lastActivityDate = studentData?.last_activity_date 
          ? new Date(studentData.last_activity_date) 
          : null;
          
        // If last activity was yesterday, increment streak
        if (lastActivityDate) {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastActivityDate.toDateString() === yesterday.toDateString()) {
            // Increment streak if last activity was yesterday
            newStreak += 1;
          } else if (lastActivityDate.toDateString() !== today.toDateString()) {
            // Reset streak if last activity was before yesterday
            newStreak = 1;
          }
          // If last activity was today, keep streak the same
        } else {
          // No previous activity, start streak at 1
          newStreak = 1;
        }
        
        // Update streak in database
        const { error: updateError } = await supabase
          .from('students')
          .update({
            study_streak: newStreak,
            last_activity_date: new Date().toISOString()
          })
          .eq('id', userId);
          
        if (updateError) {
          console.error("Error updating study streak:", updateError);
          return;
        }
        
        // Update local state
        setDashboardData(prev => ({
          ...prev,
          studyStreak: newStreak
        }));
        
        console.log("Updated study streak to:", newStreak);
      }
    } catch (error) {
      console.error("Error in updateStudyStreak:", error);
    }
  };
  
  // Update streak when completed tasks change
  useEffect(() => {
    if (dashboardData.completedTasks > 0) {
      updateStudyStreak();
    }
  }, [dashboardData.completedTasks]);
  
  // Update overall loading state when critical sections are loaded
  useEffect(() => {
    // Consider the dashboard loaded when profile and tasks are loaded
    // This allows for progressive loading of the UI
    if (!loadingStatus.profile && !loadingStatus.tasks) {
      setLoading(false)
    }
  }, [loadingStatus])

  const motivationalQuotes = [
    "Success is the sum of small efforts repeated day in and day out.",
    "The expert in anything was once a beginner.",
    "Don't watch the clock; do what it does. Keep going.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.",
    "The beautiful thing about learning is that no one can take it away from you.",
    "The more that you read, the more things you will know. The more that you learn, the more places you'll go.",
    "Your attitude, not your aptitude, will determine your altitude.",
  ]

  const todaysQuote = motivationalQuotes[new Date().getDate() % motivationalQuotes.length]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C0E19] via-[#111420] to-[#0C0E19] text-white">
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative h-16 w-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-blue-400/20"></div>
              <div className="absolute inset-0 rounded-full border-t-4 border-blue-400 animate-spin"></div>
            </div>
            <p className="text-gray-400 text-lg">Loading your StudyHike dashboard...</p>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-8">
          {/* Using ProgressiveLoadingContainer for sequential loading */}
          <ProgressiveLoadingContainer>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <span role="img" aria-label="bulb" className="text-xl">💡</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Welcome back, {dashboardData.studentName}!</h1>
                  <p className="text-gray-400 text-lg">Clarity Over Chaos. Calm Over Pressure.</p>
                </div>
              </div>
              <p className="text-gray-300 text-lg">Here's your progress overview for today</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="h-auto py-4 w-full bg-yellow-400 hover:bg-yellow-300 text-[#0C0E19] font-bold text-lg" asChild>
                  <Link href="/student/study-plan">
                    <BookOpen className="mr-3 h-5 w-5" />
                    View Study Plan
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="h-auto py-4 w-full bg-purple-500 hover:bg-purple-400 text-white font-bold text-lg" asChild>
                  <Link href="/student/study-timer">
                    <Clock className="mr-3 h-5 w-5" />
                    Study Timer
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="h-auto py-4 w-full bg-transparent border-2 border-green-400 text-green-400 hover:bg-green-400 hover:text-[#0C0E19] font-bold text-lg" asChild>
                  <Link href="/student/meeting-requests">
                    <MessageSquare className="mr-3 h-5 w-5" />
                    Request Meeting
                  </Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button className="h-auto py-4 w-full bg-transparent border-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-[#0C0E19] font-bold text-lg" asChild>
                  <Link href="/student/homework">
                    <Target className="mr-3 h-5 w-5" />
                    Submit Homework
                  </Link>
                </Button>
              </motion.div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Subscription Card */}
              <SubscriptionCard
                plan={dashboardData.subscription.plan}
                expiresAt={dashboardData.subscription.expiresAt}
                meetingsUsed={dashboardData.subscription.meetingsUsed}
                onRequestUsed={dashboardData.subscription.onRequestUsed}
                daysRemaining={dashboardData.subscription.daysRemaining}
              />
              
              <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/20 hover:border-blue-400/40 transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-bold text-blue-400">Today's Tasks</CardTitle>
                  <Target className="h-6 w-6 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{dashboardData.completedTasks}/{dashboardData.todaysTasks}</div>
                  <p className="text-blue-300 text-sm mt-1">
                    {dashboardData.todaysTasks > 0 ? `${Math.round((dashboardData.completedTasks / dashboardData.todaysTasks) * 100)}% completed` : 'No tasks today'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/20 hover:border-green-400/40 transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-bold text-green-400">Weekly Progress</CardTitle>
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{Math.round(dashboardData.weeklyProgress)}%</div>
                  <Progress value={dashboardData.weeklyProgress} className="mt-2 h-2" />
                  <p className="text-green-300 text-sm mt-1">This week's completion</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-500/20 hover:border-yellow-400/40 transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-bold text-yellow-400">Study Streak</CardTitle>
                  <Zap className="h-6 w-6 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{dashboardData.studyStreak}</div>
                  <p className="text-yellow-300 text-sm mt-1">Days in a row</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/20 hover:border-purple-400/40 transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-bold text-purple-400">Pending Tasks</CardTitle>
                  <Clock className="h-6 w-6 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{dashboardData.pendingHomework.length}</div>
                  <p className="text-purple-300 text-sm mt-1">Homework items</p>
                </CardContent>
              </Card>
          </div>

          {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Motivation Section */}
              <Card className="bg-gradient-to-br from-orange-900/50 to-red-800/30 border-orange-500/20 hover:border-orange-400/40 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl font-bold text-orange-400">
                    <Lightbulb className="mr-3 h-6 w-6" />
                    Daily Motivation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <blockquote className="text-lg italic text-gray-200 leading-relaxed">
                    "{todaysQuote}"
                  </blockquote>
                  <p className="text-orange-300 mt-4 font-medium">— StudyHike Team</p>
                </CardContent>
              </Card>

              {/* Upcoming Meetings */}
              <Card className="bg-gradient-to-br from-blue-900/50 to-indigo-800/30 border-blue-500/20 hover:border-blue-400/40 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl font-bold text-blue-400">
                    <Calendar className="mr-3 h-6 w-6" />
                    Upcoming Meetings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.upcomingMeetings.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.upcomingMeetings.slice(0, 3).map((meeting, index) => (
                        <div key={meeting.id} className="flex items-center justify-between p-3 bg-blue-900/30 rounded-lg">
                          <div>
                            <p className="font-medium text-white">{meeting.topic || 'General Discussion'}</p>
                            <p className="text-sm text-blue-300">
                              {new Date(meeting.preferred_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <Badge 
                            variant={meeting.status === 'approved' ? 'default' : meeting.status === 'pending' ? 'secondary' : 'destructive'}
                            className="capitalize"
                          >
                            {meeting.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-blue-400 mx-auto mb-3 opacity-50" />
                      <p className="text-gray-400">No upcoming meetings</p>
                      <Button className="mt-3 bg-blue-600 hover:bg-blue-500" asChild>
                        <Link href="/student/meeting-requests">Schedule a Meeting</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Homework */}
              <Card className="bg-gradient-to-br from-purple-900/50 to-pink-800/30 border-purple-500/20 hover:border-purple-400/40 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl font-bold text-purple-400">
                    <BookOpen className="mr-3 h-6 w-6" />
                    Pending Homework
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.pendingHomework.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.pendingHomework.slice(0, 3).map((homework, index) => (
                        <div key={homework.id} className="flex items-center justify-between p-3 bg-purple-900/30 rounded-lg">
                          <div>
                            <p className="font-medium text-white">{homework.title}</p>
                            <p className="text-sm text-purple-300">{homework.subject}</p>
                          </div>
                          <Badge 
                            variant={homework.isOverdue ? 'destructive' : homework.isToday ? 'default' : 'secondary'}
                          >
                            {homework.dueDate}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
                      <p className="text-gray-400">All homework completed!</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Test Scores */}
              <Card className="bg-gradient-to-br from-green-900/50 to-teal-800/30 border-green-500/20 hover:border-green-400/40 transition-all">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl font-bold text-green-400">
                    <TrendingUp className="mr-3 h-6 w-6" />
                    Recent Test Scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData.recentTests.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.recentTests.map((test, index) => (
                        <div key={test.id} className="flex items-center justify-between p-3 bg-green-900/30 rounded-lg">
                          <div>
                            <p className="font-medium text-white">{test.subject}</p>
                            <p className="text-sm text-green-300">{test.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white text-lg">{test.score}/{test.maxScore}</p>
                            <p className="text-sm text-green-300">{Math.round((test.score / test.maxScore) * 100)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-green-400 mx-auto mb-3 opacity-50" />
                      <p className="text-gray-400">No recent test scores</p>
                      <Button className="mt-3 bg-green-600 hover:bg-green-500" asChild>
                        <Link href="/student/tests">Upload Test Scores</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Today's Study Plan Summary */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <BookOpen className="mr-3 h-6 w-6 text-yellow-400" />
                Today's Study Plan
              </h2>
              <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-500/20 hover:border-yellow-400/40 transition-all">
                <CardContent className="pt-6">
                  {dashboardData.todaysTasks > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* We'll map through actual study plans instead of hardcoded subjects */}
                      {dashboardData.todaysStudyPlans && dashboardData.todaysStudyPlans.length > 0 ? (
                        dashboardData.todaysStudyPlans.map((plan, index) => (
                          <div key={plan.id} className="p-4 bg-yellow-900/30 rounded-lg">
                            <h3 className="text-lg font-bold text-yellow-400 mb-2">{plan.subject}</h3>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-300">Progress</span>
                              <span className="text-white font-medium">
                                {plan.is_completed ? "100" : "0"}%
                              </span>
                            </div>
                            <Progress 
                              value={plan.is_completed ? 100 : 0} 
                              className="h-2 bg-yellow-900/50" 
                            />
                            {plan.is_completed ? (
                              <Button 
                                className="w-full mt-4 bg-green-600 hover:bg-green-500" 
                                disabled
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Completed
                              </Button>
                            ) : (
                              <div className="grid grid-cols-2 gap-2 mt-4">
                                <Button 
                                  className="bg-yellow-600 hover:bg-yellow-500" 
                                  asChild
                                >
                                  <Link href={`/student/study-timer?subject=${plan.subject}&planId=${plan.id}`}>
                                    <Clock className="mr-2 h-4 w-4" />
                                    Start Timer
                                  </Link>
                                </Button>
                                <Button 
                                  className="bg-green-600 hover:bg-green-500"
                                  onClick={() => markPlanCompleted(plan.id)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark Done
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-4">
                          <p className="text-gray-400">No specific subjects planned for today</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-yellow-400 mx-auto mb-3 opacity-50" />
                      <p className="text-gray-400">No study plan for today</p>
                      <Button className="mt-3 bg-yellow-600 hover:bg-yellow-500" asChild>
                        <Link href="/student/study-plan">Create Study Plan</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Student Mentor Section */}
            <div>
              <StudentMentor />
            </div>
          </ProgressiveLoadingContainer>
        </div>
      )}
    </div>
  )
}