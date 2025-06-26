"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, Target, Trophy, Calendar, Quote, Heart, Zap, Loader } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

// Define interfaces for our data
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  earned: boolean;
  date?: string;
}

interface Quote {
  text: string;
  author: string;
}

export default function MotivationPage() {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [motivationalQuotes, setMotivationalQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function fetchMotivationData() {
      try {
        setLoading(true)

        if (!supabase) {
          console.error("Supabase client not initialized")
          // In demo mode, use the demo achievements
          setAchievements(demoAchievements);
          setLoading(false)
          
          // Set motivational quotes
          setMotivationalQuotes([
            {
              text: "Success is the sum of small efforts repeated day in and day out.",
              author: "Robert Collier",
            },
            {
              text: "The expert in anything was once a beginner.",
              author: "Helen Hayes",
            },
            {
              text: "Don't watch the clock; do what it does. Keep going.",
              author: "Sam Levenson",
            },
            {
              text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
              author: "Winston Churchill",
            },
            {
              text: "The way to get started is to quit talking and begin doing.",
              author: "Walt Disney",
            },
          ]);
          return;
        }

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error("Authentication error:", userError)
          router.push('/auth/login')
          return
        }

        // Fetch student data
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (studentError) {
          console.error("Student data error:", studentError)
        }

        // Fetch homework data to calculate achievements
        const { data: homeworkData, error: homeworkError } = await supabase
          .from('homework')
          .select('*')
          .eq('student_id', user.id)

        if (homeworkError) {
          console.error("Homework data error:", homeworkError)
        }

        // Fetch test data to calculate achievements
        const { data: testData, error: testError } = await supabase
          .from('tests')
          .select('*')
          .eq('student_id', user.id)

        if (testError) {
          console.error("Test data error:", testError)
        }

        // Generate achievements based on the data
        const generatedAchievements: Achievement[] = []

        // Study streak achievement
        if (studentData && studentData.study_streak >= 7) {
          generatedAchievements.push({
            id: "streak",
            title: "Study Streak Master",
            description: `Studied for ${studentData.study_streak} consecutive days`,
            icon: <Zap className="h-6 w-6 text-yellow-600" />,
            earned: true,
            date: new Date().toISOString().split('T')[0] // Today's date
          })
        } else {
          generatedAchievements.push({
            id: "streak",
            title: "Study Streak Master",
            description: "Study for 7 consecutive days",
            icon: <Zap className="h-6 w-6 text-gray-400" />,
            earned: false
          })
        }

        // High score achievement
        const highScoreTest = testData?.find(test => (test.score / test.max_score) * 100 >= 90)
        if (highScoreTest) {
          generatedAchievements.push({
            id: "highscore",
            title: `${highScoreTest.subject} Champion`,
            description: `Scored above 90% in ${highScoreTest.subject} test`,
            icon: <Trophy className="h-6 w-6 text-amber-600" />,
            earned: true,
            date: new Date(highScoreTest.created_at).toISOString().split('T')[0]
          })
        } else {
          generatedAchievements.push({
            id: "highscore",
            title: "Subject Champion",
            description: "Score above 90% in any test",
            icon: <Trophy className="h-6 w-6 text-gray-400" />,
            earned: false
          })
        }

        // Homework completion achievement
        if (homeworkData && homeworkData.length >= 5) {
          const completedHomework = homeworkData.filter(hw => 
            hw.status === 'submitted' || hw.status === 'reviewed')
          
          if (completedHomework.length >= 5) {
            generatedAchievements.push({
              id: "homework",
              title: "Homework Hero",
              description: "Completed 5 homework assignments",
              icon: <Star className="h-6 w-6 text-purple-600" />,
              earned: true,
              date: new Date().toISOString().split('T')[0]
            })
          }
        }
        
        if (generatedAchievements.length < 3) {
          generatedAchievements.push({
            id: "homework",
            title: "Homework Hero",
            description: "Complete 5 homework assignments",
            icon: <Star className="h-6 w-6 text-gray-400" />,
            earned: false
          })
        }

        // Add more achievements as needed
        generatedAchievements.push({
          id: "dedication",
          title: "Dedicated Learner",
          description: "Spend 50+ hours studying",
          icon: <Clock className="h-6 w-6 text-gray-400" />,
          earned: studentData && studentData.total_study_hours >= 50,
          date: studentData && studentData.total_study_hours >= 50 ? 
            new Date().toISOString().split('T')[0] : undefined
        })

        generatedAchievements.push({
          id: "allsubjects",
          title: "Well-Rounded Student",
          description: "Score above 80% in all three subjects",
          icon: <BookOpen className="h-6 w-6 text-gray-400" />,
          earned: false
        })

        setAchievements(generatedAchievements)

        // Set motivational quotes - these could be from the database too
        setMotivationalQuotes([
          {
            text: "Success is the sum of small efforts repeated day in and day out.",
            author: "Robert Collier",
          },
          {
            text: "The expert in anything was once a beginner.",
            author: "Helen Hayes",
          },
          {
            text: "Don't watch the clock; do what it does. Keep going.",
            author: "Sam Levenson",
          },
          {
            text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            author: "Winston Churchill",
          },
          {
            text: "The way to get started is to quit talking and begin doing.",
            author: "Walt Disney",
          },
        ])

      } catch (error) {
        console.error("Error fetching motivation data:", error)
        // Fallback to demo data
        setAchievements(demoAchievements);
        
        toast({
          title: "Error",
          description: "Failed to load motivation data. Using demo data instead.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMotivationData()
  }, [router])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin mb-4" />
        <p>Loading your motivation data...</p>
      </div>
    )
  }

  // Define icons outside of the rendering to avoid recreation
  const Clock = () => <Calendar className="h-6 w-6 text-blue-600" />
  const BookOpen = () => <BookOpen className="h-6 w-6 text-green-600" />

  // Demo achievements - these would normally come from the state
  const demoAchievements = [
    {
      id: "1",
      title: "Study Streak Master",
      description: "Studied for 7 consecutive days",
      icon: <Zap className="h-6 w-6 text-yellow-600" />,
      earned: true,
      date: "2024-06-01",
    },
    {
      id: "2",
      title: "Physics Champion",
      description: "Scored above 90% in Physics test",
      icon: <Trophy className="h-6 w-6 text-gold-600" />,
      earned: true,
      date: "2024-05-28",
    },
    {
      id: "3",
      title: "Homework Hero",
      description: "Submitted 10 homework assignments on time",
      icon: <Target className="h-6 w-6 text-blue-600" />,
      earned: true,
      date: "2024-05-25",
    },
    {
      id: "4",
      title: "Session Superstar",
      description: "Attended 5 mentor sessions this month",
      icon: <Star className="h-6 w-6 text-purple-600" />,
      earned: false,
      progress: 3,
      target: 5,
    },
    {
      id: "5",
      title: "Math Wizard",
      description: "Score above 95% in Mathematics",
      icon: <Trophy className="h-6 w-6 text-green-600" />,
      earned: false,
      progress: 92,
      target: 95,
    },
  ];

  const milestones = [
    {
      id: "1",
      title: "100 Days Until JEE Main",
      description: "Keep pushing forward!",
      daysLeft: 100,
      type: "exam",
    },
    {
      id: "2",
      title: "Monthly Target",
      description: "Complete 80% of study plan",
      progress: 72,
      target: 80,
      type: "goal",
    },
    {
      id: "3",
      title: "Physics Mastery",
      description: "Complete all Physics chapters",
      progress: 18,
      target: 25,
      type: "subject",
    },
  ]

  const successStories = [
    {
      id: "1",
      name: "Arjun Sharma",
      rank: "JEE Main AIR 245",
      story:
        "I was struggling with time management until I started following a structured study plan. The daily motivation kept me going!",
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      id: "2",
      name: "Priya Patel",
      rank: "JEE Advanced AIR 1,234",
      story: "The mentor sessions were game-changers. Having someone believe in you makes all the difference.",
      image: "/placeholder.svg?height=60&width=60",
    },
  ]

  const nextQuote = () => {
    setCurrentQuoteIndex((prev) => (prev + 1) % motivationalQuotes.length)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Stay Motivated</h1>
        <p className="text-gray-600 mt-1">Inspiration and achievements to keep you going</p>
      </div>

      {/* Daily Quote */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Quote className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Quote of the Day</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <blockquote className="text-lg italic text-gray-700 mb-4">
            "{motivationalQuotes[currentQuoteIndex].text}"
          </blockquote>
          <p className="text-gray-600 mb-4">— {motivationalQuotes[currentQuoteIndex].author}</p>
          <Button onClick={nextQuote} variant="outline">
            <Heart className="mr-2 h-4 w-4" />
            New Quote
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Achievements
            </CardTitle>
            <CardDescription>Your accomplishments and progress badges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border ${
                    achievement.earned ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={achievement.earned ? "opacity-100" : "opacity-50"}>{achievement.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-medium">{achievement.title}</h3>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                      {achievement.earned && achievement.date && (
                        <p className="text-xs text-green-600 mt-1">
                          Earned on {new Date(achievement.date).toLocaleDateString()}
                        </p>
                      )}
                      {!achievement.earned && achievement.progress && achievement.target && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>
                              {achievement.progress}/{achievement.target}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    {achievement.earned && (
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        Earned
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Milestones
            </CardTitle>
            <CardDescription>Your upcoming goals and targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900">{milestone.title}</h3>
                  <p className="text-sm text-blue-700 mb-3">{milestone.description}</p>

                  {milestone.type === "exam" && milestone.daysLeft && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="text-lg font-bold text-blue-600">{milestone.daysLeft} days left</span>
                    </div>
                  )}

                  {milestone.progress && milestone.target && (
                    <div>
                      <div className="flex justify-between text-sm text-blue-700 mb-1">
                        <span>Progress</span>
                        <span>
                          {milestone.progress}/{milestone.target}
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(milestone.progress / milestone.target) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Stories */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600" />
            Success Stories
          </CardTitle>
          <CardDescription>Stories from students who achieved their JEE dreams</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {successStories.map((story) => (
              <div key={story.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={story.image || "/placeholder.svg"}
                    alt={story.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-medium text-yellow-900">{story.name}</h3>
                    <p className="text-sm text-yellow-700">{story.rank}</p>
                  </div>
                </div>
                <blockquote className="text-sm italic text-yellow-800">"{story.story}"</blockquote>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Motivational Tips */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Daily Tips for Success</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">🎯 Set Clear Goals</h3>
              <p className="text-sm text-green-700">Break down your big goals into smaller, achievable tasks.</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">⏰ Time Management</h3>
              <p className="text-sm text-blue-700">Use the Pomodoro technique for focused study sessions.</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">🧘‍♂️ Stay Calm</h3>
              <p className="text-sm text-purple-700">Practice meditation or deep breathing when stressed.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
