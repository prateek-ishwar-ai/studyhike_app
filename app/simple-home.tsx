"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, Calendar, CheckCircle, Clock, PlayCircle, ArrowRight, Star, 
  GraduationCap, Target, Award, Users, Zap, Brain, TrendingUp
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function SimpleHomePage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

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

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading StudyHike...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-blue-400 mr-2" />
              <span className="text-xl font-bold">StudyHike</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-white hover:text-blue-400">
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Transform Your{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                JEE Journey
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Get personalized mentorship, strategic study plans, and continuous support 
              to achieve your target rank in JEE/NEET exams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                <PlayCircle className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
          >
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-green-400 mb-2">2000+</div>
                <div className="text-slate-300">Students Helped</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-blue-400 mb-2">98%</div>
                <div className="text-slate-300">Success Rate</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-purple-400 mb-2">4.9★</div>
                <div className="text-slate-300">Average Rating</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose StudyHike?
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Our proven methodology combines the best of personalized mentorship and technology
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 h-full hover:bg-slate-700/50 transition-colors">
                  <CardContent className="p-6 text-center">
                    <feature.icon className={`h-12 w-12 ${feature.color} mx-auto mb-4`} />
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-slate-300 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Start your journey with our free plan or unlock premium features
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 + index * 0.1 }}
              >
                <Card className={`${
                  plan.popular 
                    ? 'bg-gradient-to-br from-blue-800/50 to-purple-800/50 border-blue-500' 
                    : 'bg-slate-800/50 border-slate-700'
                } h-full relative`}>
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-slate-300 ml-1">/{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                          <span className="text-slate-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/auth/signup" className="block">
                      <Button 
                        className={`w-full ${
                          plan.popular 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-slate-600 hover:bg-slate-700'
                        }`}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <Card className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 border-purple-500">
              <CardContent className="p-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to Start Your Success Journey?
                </h2>
                <p className="text-xl text-slate-300 mb-8">
                  Join thousands of students who transformed their JEE preparation with StudyHike
                </p>
                <Link href="/auth/signup">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Get Started Now
                    <TrendingUp className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <GraduationCap className="h-8 w-8 text-blue-400 mr-2" />
            <span className="text-xl font-bold">StudyHike</span>
          </div>
          <p className="text-slate-400 mb-4">
            Transform your JEE preparation with personalized mentorship and proven strategies.
          </p>
          <p className="text-slate-500 text-sm">
            © 2024 StudyHike. All rights reserved. | Made with ❤️ for JEE aspirants
          </p>
        </div>
      </footer>
    </div>
  )
}