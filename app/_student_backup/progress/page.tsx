"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Target, Clock, BookOpen, Calendar, Loader } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

// Define interfaces for our data
interface ProgressData {
  overall: {
    completion: number;
    weeklyTarget: number;
    studyHours: number;
    targetHours: number;
  };
  subjects: {
    [key: string]: {
      completion: number;
      trend: string;
      lastTest: number;
      avgScore: number;
      hoursSpent: number;
      targetHours: number;
    };
  };
  weeklyProgress: { week: string; completion: number }[];
  recentActivities: {
    id: string;
    type: string;
    description: string;
    date: string;
    score?: number;
    duration?: number;
  }[];
}

export default function ProgressPage() {
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchProgressData() {
      try {
        setLoading(true);

        if (!supabase) {
          console.error("Supabase client not initialized");
          setLoading(false);
          return;
        }

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error("Authentication error:", userError);
          router.push('/auth/login');
          return;
        }

        // Fetch data from various tables
        const [studyPlanResult, testsResult, homeworkResult, sessionsResult, studentResult] = await Promise.all([
          // Get study plan
          supabase
            .from('study_plans')
            .select('*')
            .eq('student_id', user.id),
          
          // Get tests
          supabase
            .from('tests')
            .select('*')
            .eq('student_id', user.id)
            .order('created_at', { ascending: false }),
          
          // Get homework
          supabase
            .from('homework')
            .select('*')
            .eq('student_id', user.id)
            .order('created_at', { ascending: false }),
          
          // Get sessions
          supabase
            .from('sessions')
            .select('*')
            .eq('student_id', user.id)
            .order('created_at', { ascending: false }),
            
          // Get student data
          supabase
            .from('students')
            .select('*')
            .eq('id', user.id)
            .maybeSingle()
        ]);

        // Process the data to build our progress data structure
        
        // Define default subjects if none are found
        const subjects = {
          "Physics": {
            completion: 0,
            trend: "up",
            lastTest: 0,
            avgScore: 0,
            hoursSpent: 0,
            targetHours: 10
          },
          "Chemistry": {
            completion: 0,
            trend: "up",
            lastTest: 0,
            avgScore: 0,
            hoursSpent: 0,
            targetHours: 10
          },
          "Mathematics": {
            completion: 0,
            trend: "up",
            lastTest: 0,
            avgScore: 0,
            hoursSpent: 0,
            targetHours: 10
          }
        };

        // Calculate subject-specific metrics if we have test data
        if (testsResult.data && testsResult.data.length > 0) {
          // Group tests by subject
          const testsBySubject: Record<string, any[]> = {};
          
          testsResult.data.forEach(test => {
            if (!testsBySubject[test.subject]) {
              testsBySubject[test.subject] = [];
            }
            testsBySubject[test.subject].push(test);
          });
          
          // Calculate metrics for each subject
          Object.keys(testsBySubject).forEach(subject => {
            const subjectTests = testsBySubject[subject];
            
            if (subjectTests.length > 0) {
              // Calculate average score
              const scores = subjectTests.map(test => (test.score / test.max_score) * 100);
              const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
              
              // Get the most recent test score
              const lastTest = (subjectTests[0].score / subjectTests[0].max_score) * 100;
              
              // Determine trend (comparing latest to previous)
              const trend = subjectTests.length > 1 ? 
                ((subjectTests[0].score / subjectTests[0].max_score) > 
                (subjectTests[1].score / subjectTests[1].max_score) ? "up" : "down") : 
                "up";
              
              // Create or update the subject entry
              subjects[subject] = {
                ...subjects[subject],
                avgScore: Math.round(avgScore),
                lastTest: Math.round(lastTest),
                trend,
                completion: Math.round(avgScore), // Use average score as completion percentage
              };
            }
          });
        }
        
        // Calculate study hours per subject from sessions if available
        if (sessionsResult.data && sessionsResult.data.length > 0) {
          const sessionsBySubject: Record<string, any[]> = {};
          
          sessionsResult.data.forEach(session => {
            if (!sessionsBySubject[session.subject]) {
              sessionsBySubject[session.subject] = [];
            }
            sessionsBySubject[session.subject].push(session);
          });
          
          Object.keys(sessionsBySubject).forEach(subject => {
            const subjectSessions = sessionsBySubject[subject];
            const totalHours = subjectSessions.reduce((total, session) => {
              // If duration is in minutes, convert to hours
              return total + (session.duration || 0) / 60;
            }, 0);
            
            if (subjects[subject]) {
              subjects[subject].hoursSpent = Math.round(totalHours);
            }
          });
        }
        
        // Calculate overall study hours
        const totalStudyHours = studentResult.data?.total_study_hours || 
          Object.values(subjects).reduce((total, subject) => total + subject.hoursSpent, 0);
        
        // Calculate weekly progress (using static data for now)
        const weeklyProgress = [
          { week: "Week 1", completion: 65 },
          { week: "Week 2", completion: 70 },
          { week: "Week 3", completion: 68 },
          { week: "Week 4", completion: 72 },
        ];
        
        // Build recent activities from tests, homework, and sessions
        const recentActivities = [];
        
        // Add test activities
        if (testsResult.data) {
          testsResult.data.slice(0, 3).forEach(test => {
            recentActivities.push({
              id: `test-${test.id}`,
              type: "test",
              description: `Completed ${test.subject} test on ${test.title}`,
              date: new Date(test.created_at).toISOString().split('T')[0],
              score: Math.round((test.score / test.max_score) * 100)
            });
          });
        }
        
        // Add homework activities
        if (homeworkResult.data) {
          homeworkResult.data.slice(0, 3).forEach(hw => {
            recentActivities.push({
              id: `hw-${hw.id}`,
              type: "homework",
              description: `${hw.status === 'submitted' ? 'Submitted' : 'Received'} ${hw.subject} assignment on ${hw.title}`,
              date: new Date(hw.created_at).toISOString().split('T')[0],
              score: hw.score
            });
          });
        }
        
        // Add session activities
        if (sessionsResult.data) {
          sessionsResult.data.slice(0, 3).forEach(session => {
            recentActivities.push({
              id: `session-${session.id}`,
              type: "session",
              description: `${session.status === 'completed' ? 'Completed' : 'Scheduled'} ${session.subject} session on ${session.topic || 'General Topics'}`,
              date: new Date(session.created_at).toISOString().split('T')[0],
              duration: session.duration
            });
          });
        }
        
        // Sort activities by date (most recent first)
        recentActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        // Calculate overall completion based on subject scores
        const overallCompletion = Object.values(subjects).reduce(
          (sum, subject) => sum + subject.completion, 
          0
        ) / Object.keys(subjects).length;
        
        // Target hours calculation
        const targetHours = Object.values(subjects).reduce(
          (sum, subject) => sum + subject.targetHours, 
          0
        );
        
        // Build the final progress data object
        const progressData: ProgressData = {
          overall: {
            completion: Math.round(overallCompletion),
            weeklyTarget: 80, // This could be from study plan if available
            studyHours: totalStudyHours,
            targetHours: targetHours,
          },
          subjects,
          weeklyProgress,
          recentActivities: recentActivities.slice(0, 5)
        };
        
        setProgressData(progressData);
      } catch (error) {
        console.error("Error fetching progress data:", error);
        toast({
          title: "Error",
          description: "Failed to load progress data. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchProgressData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin mb-4" />
        <p>Loading your progress data...</p>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div className="text-center py-10">
        <p>No progress data available yet. Start your learning journey to see your progress!</p>
      </div>
    );
  }

  // The rest of the component stays the same
  const recentActivities = [
      {
        id: "1",
        type: "homework",
        description: "Completed Physics homework on Thermodynamics",
        date: "2024-06-02",
        score: 85,
      },
      {
        id: "2",
        type: "test",
        description: "Mathematics Mock Test - Calculus",
        date: "2024-06-01",
        score: 92,
      },
      {
        id: "3",
        type: "session",
        description: "1-on-1 session with Chemistry mentor",
        date: "2024-05-31",
        duration: 60,
      },
      {
        id: "4",
        type: "homework",
        description: "Submitted Chemistry assignment on Organic Reactions",
        date: "2024-05-30",
        score: 78,
      },
    ];

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case "Physics":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Chemistry":
        return "bg-green-100 text-green-800 border-green-200"
      case "Mathematics":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTrendIcon = (trend: string) => {
    if (trend === "up") {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    }
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "homework":
        return <BookOpen className="h-4 w-4 text-blue-600" />
      case "test":
        return <Target className="h-4 w-4 text-green-600" />
      case "session":
        return <Calendar className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Progress Reports</h1>
        <p className="text-gray-600 mt-1">Track your learning progress and performance analytics</p>
      </div>

      {/* Overall Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.overall.completion}%</div>
            <Progress value={progressData.overall.completion} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Target: {progressData.overall.weeklyTarget}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.overall.studyHours}h</div>
            <Progress
              value={(progressData.overall.studyHours / progressData.overall.targetHours) * 100}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">Target: {progressData.overall.targetHours}h this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Subject</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Mathematics</div>
            <p className="text-xs text-muted-foreground">78% completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Improvement Area</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Chemistry</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subjects" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subjects">Subject Performance</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Trends</TabsTrigger>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(progressData.subjects).map(([subject, data]) => (
              <Card key={subject}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{subject}</CardTitle>
                    {getTrendIcon(data.trend)}
                  </div>
                  <Badge className={getSubjectColor(subject)}>{data.completion}% Complete</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{data.completion}%</span>
                    </div>
                    <Progress value={data.completion} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Study Hours</span>
                      <span>
                        {data.hoursSpent}/{data.targetHours}h
                      </span>
                    </div>
                    <Progress value={(data.hoursSpent / data.targetHours) * 100} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{data.lastTest}</p>
                      <p className="text-xs text-gray-500">Last Test</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{data.avgScore}</p>
                      <p className="text-xs text-gray-500">Average</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Progress Trends</CardTitle>
              <CardDescription>Your completion rate over the past 4 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressData.weeklyProgress.map((week, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-20 text-sm font-medium">{week.week}</div>
                    <div className="flex-1">
                      <Progress value={week.completion} />
                    </div>
                    <div className="w-12 text-sm text-right">{week.completion}%</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Your latest homework, tests, and sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progressData.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.description}</p>
                      <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      {activity.score && <p className="text-lg font-bold text-blue-600">{activity.score}%</p>}
                      {activity.duration && <p className="text-sm text-gray-600">{activity.duration} min</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
