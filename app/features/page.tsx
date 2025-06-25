import { Navbar } from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Calendar, CheckCircle, TrendingUp, Users, FileText, Star, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002B5B] to-[#F0F4F8]">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Comprehensive Features for <span className="text-[#FFBB00]">JEE Success</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
              Discover all the tools and resources designed to help you excel in your JEE preparation
            </p>
          </div>
        </div>
      </section>

      {/* Feature Categories */}
      <section className="py-20 bg-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Study Planning */}
            <Card className="bg-white rounded-2xl shadow-md border-0 overflow-hidden transform transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="h-2 bg-[#0070F3]"></div>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full bg-[#0070F3]/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-[#0070F3]" />
                  </div>
                  <CardTitle className="text-[#002B5B]">Study Planning</CardTitle>
                </div>
                <CardDescription className="text-[#002B5B]/70">Organize your preparation effectively</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#0070F3] mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-[#002B5B]">Personalized Study Plans</h4>
                      <p className="text-sm text-[#002B5B]/70">
                        Custom schedules based on your strengths, weaknesses, and target exam dates
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#0070F3] mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-[#002B5B]">Weekly Planners</h4>
                      <p className="text-sm text-[#002B5B]/70">Day-by-day breakdown of subjects and topics to cover</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#0070F3] mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-[#002B5B]">Study Streak Tracking</h4>
                      <p className="text-sm text-[#002B5B]/70">
                        Gamified system to maintain consistency in your preparation
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Homework Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-6 w-6 text-green-600" />
                  <CardTitle>Homework Management</CardTitle>
                </div>
                <CardDescription>Track assignments and submissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Assignment Tracking</h4>
                      <p className="text-sm text-gray-600">Keep track of pending, submitted, and reviewed homework</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium">File Uploads</h4>
                      <p className="text-sm text-gray-600">Submit your work as PDFs or images for mentor review</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Detailed Feedback</h4>
                      <p className="text-sm text-gray-600">Get personalized comments an ratings from your mentor</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Analytics */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                  <CardTitle>Performance Analytics</CardTitle>
                </div>
                <CardDescription>Track your improvement over time</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Test Score Analysis</h4>
                      <p className="text-sm text-gray-600">Upload test scores and get detailed performance insights</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Progress Reports</h4>
                      <p className="text-sm text-gray-600">Weekly and monthly reports showing your improvement</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Weak Area Identification</h4>
                      <p className="text-sm text-gray-600">
                        AI-powered analysis to identify topics that need more focus
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mentorship */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-orange-600" />
                  <CardTitle>Expert Mentorship</CardTitle>
                </div>
                <CardDescription>1-on-1 guidance from IITians</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Personal Mentor Assignment</h4>
                      <p className="text-sm text-gray-600">Get matched with an experienced IITian mentor</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Live Sessions</h4>
                      <p className="text-sm text-gray-600">Regular video calls for doubt clearing and guidance</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium">24/7 Support</h4>
                      <p className="text-sm text-gray-600">Ask questions anytime through our messaging system</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resources */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-red-600" />
                  <CardTitle>Study Resources</CardTitle>
                </div>
                <CardDescription>Comprehensive learning materials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Curated Study Materials</h4>
                      <p className="text-sm text-gray-600">High-quality PDFs, videos, and practice problems</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Formula Sheets</h4>
                      <p className="text-sm text-gray-600">Quick reference guides for all subjects</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Video Lectures</h4>
                      <p className="text-sm text-gray-600">Concept explanations and problem-solving techniques</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Motivation */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Star className="h-6 w-6 text-yellow-600" />
                  <CardTitle>Motivation & Support</CardTitle>
                </div>
                <CardDescription>Stay motivated throughout your journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Daily Motivation</h4>
                      <p className="text-sm text-gray-600">Inspirational quotes and success stories</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Community Support</h4>
                      <p className="text-sm text-gray-600">Connect with fellow JEE aspirants</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Achievement Tracking</h4>
                      <p className="text-sm text-gray-600">Celebrate milestones and maintain momentum</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#002B5B]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Transform Your JEE Preparation?</h2>
          <p className="text-xl text-white/80 mb-8">
            Join students who have improved their ranks with our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="text-lg px-8 py-6 rounded-2xl bg-[#FFBB00] hover:bg-[#E5A800] text-[#002B5B] font-medium">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 rounded-2xl text-white border-white/20 hover:bg-white/10"
              >
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
