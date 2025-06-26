"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  Target, 
  Clock, 
  Users, 
  Star,
  ArrowRight,
  CheckCircle,
  Zap,
  TrendingUp,
  Brain
} from "lucide-react"
import { motion } from "framer-motion"

export default function MobileAppHome() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const features = [
    {
      icon: Target,
      title: "Personal Mentorship",
      description: "1-on-1 guidance from JEE toppers",
      color: "bg-blue-500"
    },
    {
      icon: Brain,
      title: "Smart Study Plans",
      description: "AI-powered personalized learning paths",
      color: "bg-purple-500"
    },
    {
      icon: Clock,
      title: "Progress Tracking",
      description: "Real-time performance analytics",
      color: "bg-green-500"
    },
    {
      icon: Zap,
      title: "Quick Doubt Solving",
      description: "Instant help when you need it",
      color: "bg-orange-500"
    }
  ]

  const plans = [
    {
      name: "Free Plan",
      price: "₹0",
      period: "forever",
      features: [
        "6-8 meetings/month",
        "15-minute sessions",
        "Basic progress tracking",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Pro Plan",
      price: "₹199",
      period: "month",
      features: [
        "8-10 meetings/month",
        "25-minute sessions",
        "Test analysis",
        "Priority support",
        "Study resources"
      ],
      popular: true
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
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
        transition={{ duration: 0.6 }}
        className="p-4 pt-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            StudyHike
          </h1>
          <p className="text-slate-300 text-lg">
            Your JEE Success Partner
          </p>
        </div>
      </motion.div>

      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="px-4 mb-8"
      >
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <Badge className="bg-green-500 text-white mb-2">
                <CheckCircle className="w-4 h-4 mr-1" />
                Live Now
              </Badge>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">
              Transform Your JEE Preparation
            </h2>
            <p className="text-slate-300 mb-6">
              Get personalized mentorship, track your progress, and achieve your target rank with our proven system.
            </p>
            <div className="space-y-3">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Watch Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Features Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="px-4 mb-8"
      >
        <h3 className="text-xl font-semibold mb-4 text-center">
          Why Choose StudyHike?
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: isVisible ? 1 : 0, 
                scale: isVisible ? 1 : 0.8 
              }}
              transition={{ 
                duration: 0.5, 
                delay: 0.6 + index * 0.1 
              }}
            >
              <Card className="bg-slate-800/50 border-slate-700 h-full">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 ${feature.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-semibold text-sm mb-2 text-white">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-slate-300">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="px-4 mb-8"
      >
        <Card className="bg-gradient-to-r from-green-800/50 to-blue-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">2000+</div>
                <div className="text-xs text-slate-300">Students Helped</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">98%</div>
                <div className="text-xs text-slate-300">Success Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">4.9★</div>
                <div className="text-xs text-slate-300">Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pricing Plans */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.8, delay: 1.0 }}
        className="px-4 mb-8"
      >
        <h3 className="text-xl font-semibold mb-4 text-center">
          Choose Your Plan
        </h3>
        <div className="space-y-4">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`${
                plan.popular 
                  ? 'bg-gradient-to-r from-blue-800/50 to-purple-800/50 border-blue-500' 
                  : 'bg-slate-800/50 border-slate-700'
              } relative`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                  Most Popular
                </Badge>
              )}
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-white">{plan.name}</h4>
                    <div className="flex items-baseline">
                      <span className="text-2xl font-bold text-white">{plan.price}</span>
                      <span className="text-sm text-slate-300">/{plan.period}</span>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    className={plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-600 hover:bg-slate-700'}
                  >
                    {plan.price === '₹0' ? 'Start Free' : 'Choose Plan'}
                  </Button>
                </div>
                <div className="space-y-1">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center text-sm">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                      <span className="text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="px-4 pb-8"
      >
        <Card className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 border-purple-500">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold mb-2 text-white">
              Ready to Start Your Success Journey?
            </h3>
            <p className="text-slate-300 mb-4">
              Join thousands of students who achieved their JEE dreams with StudyHike
            </p>
            <Button 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              size="lg"
            >
              Get Started Now
              <TrendingUp className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}