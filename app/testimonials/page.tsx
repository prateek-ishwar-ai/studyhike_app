import { Navbar } from "@/components/layout/navbar"
import Footer from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Quote, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function TestimonialsPage() {
  const testimonials = [
    {
      name: "Arjun Sharma",
      role: "JEE Main 2024 - AIR 245",
      image: "/placeholder.svg?height=100&width=100",
      content:
        "The personalized study plan and regular mentorship helped me improve my rank from 15,000 to 245 in just 6 months! The mentors are incredibly supportive and always available when I needed help.",
      rating: 5,
      improvement: "Rank improved from 15,000 to 245",
      subject: "Overall Performance",
    },
    {
      name: "Priya Patel",
      role: "JEE Advanced 2024 - AIR 1,234",
      image: "/placeholder.svg?height=100&width=100",
      content:
        "My mentor's guidance on time management and test strategy was invaluable. The weekly sessions helped me stay focused and motivated throughout my preparation.",
      rating: 5,
      improvement: "Time management improved by 40%",
      subject: "Strategy & Planning",
    },
    {
      name: "Rohit Kumar",
      role: "JEE Main 2024 - AIR 567",
      image: "/placeholder.svg?height=100&width=100",
      content:
        "The homework tracking and performance analysis helped me identify my weak areas and work on them systematically. The detailed feedback was extremely helpful.",
      rating: 5,
      improvement: "Physics score improved by 35%",
      subject: "Physics",
    },
    {
      name: "Sneha Gupta",
      role: "JEE Advanced 2024 - AIR 2,890",
      image: "/placeholder.svg?height=100&width=100",
      content:
        "The study streak feature kept me motivated every day. Having a personal mentor made all the difference in my preparation strategy.",
      rating: 5,
      improvement: "Consistency improved by 60%",
      subject: "Motivation & Consistency",
    },
    {
      name: "Vikash Singh",
      role: "JEE Main 2024 - AIR 1,123",
      image: "/placeholder.svg?height=100&width=100",
      content:
        "The test analysis feature helped me understand my mistakes and improve my accuracy. The mentors provided excellent guidance for each subject.",
      rating: 5,
      improvement: "Accuracy improved by 25%",
      subject: "Test Strategy",
    },
    {
      name: "Ananya Reddy",
      role: "JEE Advanced 2024 - AIR 3,456",
      image: "/placeholder.svg?height=100&width=100",
      content:
        "The platform's comprehensive approach covering study plans, homework, and mentorship made my preparation much more organized and effective.",
      rating: 5,
      improvement: "Chemistry score improved by 40%",
      subject: "Chemistry",
    },
  ]

  const stats = [
    { label: "Students Mentored", value: "10,000+" },
    { label: "Average Rank Improvement", value: "5,000+" },
    { label: "Success Rate", value: "95%" },
    { label: "Mentor Rating", value: "4.9/5" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#002B5B] to-[#F0F4F8]">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Success Stories from <span className="text-[#FFBB00]">StudyHike Students</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-3xl mx-auto">
              Hear from students who achieved their goals with our personalized mentorship and guidance
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10">
                <div className="text-3xl md:text-4xl font-bold text-[#FFBB00] mb-2">{stat.value}</div>
                <div className="text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">What Our Students Say</h2>
            <p className="text-xl text-white/80">Real stories from real students who achieved their JEE goals</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white rounded-2xl shadow-md border-0 overflow-hidden transform transition-all hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-[#F0F4F8] flex items-center justify-center mr-4 overflow-hidden">
                      <img
                        src={testimonial.image || "/placeholder.svg"}
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#002B5B] text-lg">{testimonial.name}</h3>
                      <p className="text-sm text-[#002B5B]/70">{testimonial.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge className="bg-[#F0F4F8] text-[#002B5B] hover:bg-[#E1E8F0]">{testimonial.subject}</Badge>
                    <Badge variant="outline" className="text-[#00CC88] border-[#00CC88]/30 bg-[#00CC88]/5">
                      {testimonial.improvement}
                    </Badge>
                  </div>
                  
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < testimonial.rating ? 'text-[#FFBB00] fill-[#FFBB00]' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  
                  <p className="text-[#002B5B]/70 italic">
                    "{testimonial.content}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Video Testimonials Section */}
      <section className="py-20 bg-[#F0F4F8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#002B5B] mb-4">Video Testimonials</h2>
            <p className="text-xl text-[#002B5B]/70">Watch our students share their success stories</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((video, index) => (
              <div key={index} className="relative aspect-video bg-gray-200 rounded-2xl overflow-hidden shadow-md transform transition-all hover:shadow-lg hover:-translate-y-1">
                <img
                  src={`/placeholder.svg?height=400&width=600`}
                  alt={`Video testimonial ${video}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <Button size="lg" className="rounded-full bg-[#FFBB00] hover:bg-[#E5A800] text-[#002B5B]">
                    <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 5v10l8-5-8-5z" />
                    </svg>
                  </Button>
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="font-semibold">Student Success Story {video}</p>
                  <p className="text-sm opacity-90">JEE Main 2024 Topper</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#002B5B]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Write Your Success Story?</h2>
          <p className="text-xl text-white/80 mb-8">
            Join students who have achieved their JEE dreams with our platform
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="text-lg px-8 py-6 rounded-2xl bg-[#FFBB00] hover:bg-[#E5A800] text-[#002B5B] font-medium">
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
