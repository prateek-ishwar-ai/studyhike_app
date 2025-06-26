import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, Calendar, CheckCircle, Clock, PlayCircle, ArrowRight, Star, 
  GraduationCap, Target, Award, Users, Zap, Brain, TrendingUp
} from "lucide-react"
import Link from "next/link"

export default function StaticHomePage() {
  const features = [
    {
      icon: Target,
      title: "Personal Mentorship",
      description: "1-on-1 guidance from JEE toppers",
      color: "text-blue-400"
    },
    {
      icon: Brain,
      title: "Smart Study Plans",
      description: "AI-powered personalized learning paths",
      color: "text-purple-400"
    },
    {
      icon: Clock,
      title: "Progress Tracking",
      description: "Real-time performance analytics",
      color: "text-green-400"
    },
    {
      icon: Award,
      title: "Expert Support",
      description: "24/7 guidance from experienced mentors",
      color: "text-orange-400"
    }
  ]

  const plans = [
    {
      name: "Free Plan",
      price: "₹0",
      period: "forever",
      features: [
        "6-8 meetings per month",
        "15-minute sessions",
        "Basic progress tracking",
        "Email support"
      ],
      popular: false,
      cta: "Start Free"
    },
    {
      name: "Pro Plan",
      price: "₹199",
      period: "month",
      features: [
        "8-10 meetings per month",
        "25-minute sessions",
        "Test analysis & reports",
        "Priority support",
        "Study resources access"
      ],
      popular: true,
      cta: "Choose Pro"
    },
    {
      name: "Premium Plan",
      price: "₹499",
      period: "month",
      features: [
        "Unlimited meetings",
        "30-minute sessions",
        "Custom study plans",
        "24/7 chat support",
        "Premium resources"
      ],
      popular: false,
      cta: "Go Premium"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">StudyHike</span>
          </div>
          <div className="hidden md:flex space-x-6">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#journey" className="text-gray-300 hover:text-white transition-colors">Journey</a>
            <a href="#plans" className="text-gray-300 hover:text-white transition-colors">Plans</a>
            <a href="#stories" className="text-gray-300 hover:text-white transition-colors">Stories</a>
          </div>
          <Link href="/auth/login">
            <Button variant="outline" className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white">
              Login
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Your JEE Journey Starts With the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
              Right Guidance
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            StudyHike is your companion through JEE's struggle — helping you stay calm, stay focused, and move with purpose.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#plans">
              <Button size="lg" variant="outline" className="border-gray-400 text-gray-300 hover:bg-gray-800 px-8 py-3">
                View Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Why Choose StudyHike?
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Transform your academic chaos into focused success with our expert mentorship and proven strategies.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Journey Section */}
      <section id="journey" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Student Transformation Journey
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto">
            Follow the proven path from academic struggle to breakthrough success. Our comprehensive mentorship system guides you through every step.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Stage 1: Stuck Student */}
          <Card className="bg-red-900/20 border-red-700/50">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-red-900/50 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">😰</span>
              </div>
              <CardTitle className="text-center text-white">STUCK STUDENT</CardTitle>
              <p className="text-center text-gray-400">The Starting Point</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  Declining mock scores despite hours of study
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  No clear strategy or direction
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  Overwhelming syllabus with no prioritization
                </li>
                <li className="flex items-start">
                  <span className="text-red-400 mr-2">•</span>
                  Constant anxiety and mounting pressure
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Stage 2: Guided Learning */}
          <Card className="bg-yellow-900/20 border-yellow-700/50">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-yellow-900/50 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <CardTitle className="text-center text-white">GUIDED LEARNING</CardTitle>
              <p className="text-center text-gray-400">The Transformation</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  Personal mentor assigned for dedicated support
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  Strategic study planning with clear priorities
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  Regular progress tracking and course corrections
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  Expert test analysis with actionable insights
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Stage 3: Success Achieved */}
          <Card className="bg-green-900/20 border-green-700/50">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-green-900/50 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎉</span>
              </div>
              <CardTitle className="text-center text-white">SUCCESS ACHIEVED</CardTitle>
              <p className="text-center text-gray-400">The Breakthrough</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  Target rank achieved with confidence
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  Dream college admission secured
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  Confident problem-solving abilities developed
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">•</span>
                  Consistent improvement and sustained motivation
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Select the perfect plan that matches your preparation needs and goals
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'bg-blue-900/30 border-blue-500' : 'bg-slate-800/50 border-slate-700'} hover:scale-105 transition-transform`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                <div className="py-4">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  {plan.period !== 'forever' && <span className="text-gray-400">/{plan.period}</span>}
                </div>
                <p className="text-gray-400">Perfect for {plan.name.toLowerCase().replace(' plan', '')} users</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-gray-300">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup">
                  <Button className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-600'} text-white`}>
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Success Stories */}
      <section id="stories" className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Success Stories
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Real results from real students who transformed their JEE/NEET preparation with StudyHike
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                "StudyHike helped me achieve my target rank when I was completely lost in my preparation strategy. The personalized guidance made all the difference."
              </p>
              <div className="border-t border-slate-700 pt-4">
                <p className="text-white font-semibold">Manvinder</p>
                <p className="text-blue-400 text-sm">JEE Mains Rank: 14,900</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                "The regular mentoring sessions and test analysis helped me identify my weak areas and work on them systematically. Couldn't have done it without StudyHike."
              </p>
              <div className="border-t border-slate-700 pt-4">
                <p className="text-white font-semibold">Anonymous Student</p>
                <p className="text-blue-400 text-sm">JEE Advanced Rank: 26,000</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-300 mb-4">
                "From struggling with concepts to achieving 98 percentile - StudyHike transformed my entire approach to JEE preparation. The mentor support was incredible."
              </p>
              <div className="border-t border-slate-700 pt-4">
                <p className="text-white font-semibold">Himanshu</p>
                <p className="text-blue-400 text-sm">98 percentile in JEE Mains</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your JEE Journey?
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Join thousands of students who have already started their transformation with StudyHike
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-gray-400 text-gray-300 hover:bg-gray-800 px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold text-white">StudyHike</span>
              </div>
              <p className="text-gray-400 text-sm">
                Clarity Over Chaos. Calm Over Pressure.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#plans" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#stories" className="hover:text-white transition-colors">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 StudyHike. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}