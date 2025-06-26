"use client"

import React, { useEffect, useState, useRef } from "react"
import { Navbar } from "@/components/layout/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, Calendar, CheckCircle, Clock, PlayCircle, ArrowRight, Star, 
  GraduationCap, Target, Award, Compass, BarChart, Users, Zap, BookMarked, 
  Brain, Lightbulb, Sparkles, ChevronRight, X, ChevronDown, ArrowDown,
  AlertTriangle, AlertCircle, Cpu, Settings, Power, Activity, Gauge,
  Leaf, Mountain, Sunrise, TrendingUp
} from "lucide-react"
import Link from "next/link"
import Footer from "@/components/layout/footer"
import SciFiStudent from "@/components/sci-fi-student"
import CircuitFlow from "@/components/circuit-flow"
import EnergyFlow from "@/components/energy-flow"
import ScrollAnimation from "@/components/scroll-animation"
import SciFiButton from "@/components/sci-fi-button"
import PlanCard from "@/components/plan-card"
import TerminalText from "@/components/terminal-text"
import OnboardingForm from "@/components/onboarding-form"

import SimpleHomePage from "./simple-home"

export default function HomePage() {
  return <SimpleHomePage />
}

// Original HomePage function - keeping for reference
function OriginalHomePage() {
  const [scrollY, setScrollY] = useState(0)
  const [energyFlowActive, setEnergyFlowActive] = useState(false)
  const [studentState, setStudentState] = useState<'sad' | 'happy' | 'transforming'>('sad')
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  
  const heroRef = useRef<HTMLDivElement>(null)
  const energyRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const transformationRef = useRef<HTMLDivElement>(null)
  const plansRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      
      // Activate energy flow after scrolling past hero section
      if (heroRef.current && energyRef.current) {
        const energyRect = energyRef.current.getBoundingClientRect()
        
        if (energyRect.top < window.innerHeight * 0.7) {
          setEnergyFlowActive(true)
          
          // Set student to transforming state when energy is detected
          if (studentState === 'sad') {
            setStudentState('transforming')
            
            // After 2 seconds, change to happy state
            setTimeout(() => {
              setStudentState('happy')
            }, 2000)
          }
        }
      }
      
      // Reset student state when scrolling back to top
      if (window.scrollY < 100 && studentState !== 'sad') {
        setStudentState('sad')
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [studentState])
  
  const handlePlanSelect = (planName: string) => {
    setSelectedPlan(planName)
    setShowOnboardingModal(true)
  }
  
  const handleFormSubmit = (data: FormData) => {
    console.log('Form submitted:', Object.fromEntries(data.entries()))
    // Here you would typically send this data to your backend
  }

  return (
    <div className="min-h-screen bg-[#0F172A] font-sans text-[#F8FAFC]">
      <Navbar className="border-none absolute top-0 left-0 right-0 z-50 bg-transparent" />

      {/* SECTION 1: Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden min-h-screen flex items-center">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-cover bg-center">
          <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-[#60A5FA] opacity-30 animate-gentle-pulse"></div>
          <div className="absolute top-1/3 left-1/2 w-5 h-5 rounded-full bg-[#FACC15] opacity-20 animate-gentle-pulse" style={{animationDelay: "0.5s"}}></div>
          <div className="absolute top-2/3 left-1/3 w-4 h-4 rounded-full bg-[#60A5FA] opacity-30 animate-gentle-pulse" style={{animationDelay: "0.7s"}}></div>
          <div className="absolute top-1/2 left-3/4 w-6 h-6 rounded-full bg-[#FACC15] opacity-20 animate-gentle-pulse" style={{animationDelay: "1.1s"}}></div>
          <div className="absolute top-3/4 left-1/4 w-5 h-5 rounded-full bg-[#60A5FA] opacity-30 animate-gentle-pulse" style={{animationDelay: "1.3s"}}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-24 pb-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight font-['Space_Grotesk',_sans-serif]">
                Your Transformation <span className="text-[#FACC15] animate-gentle-pulse inline-block">Begins Here</span>
              </h1>
              
              <div className="mb-8 text-xl text-[#CBD5E1]">
                StudyHike guides JEE/NEET aspirants through a proven journey from struggle to success.
                <span className="text-[#FACC15] font-medium ml-1 glow-text">Ready to excel?</span>
              </div>
              
              <div className="mt-8">
                <SciFiButton 
                  variant="default" 
                  size="lg"
                  className="group"
                  onClick={() => {
                    // Smooth scroll to energy section
                    energyRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  withSound={true}
                >
                  Discover Your Path
                  <ArrowDown className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </SciFiButton>
              </div>
            </div>
            
            <div className="relative flex justify-center items-center">
              {/* 3D Student Animation - Sad state with swirling thoughts */}
              <div className="w-full max-w-md">
                <SciFiStudent state="sad" showScreens={true} />
              </div>
            </div>
          </div>
          
          <div className="mt-12 animate-bounce absolute bottom-10 left-1/2 transform -translate-x-1/2">
            <ArrowDown className="h-8 w-8 mx-auto text-[#60A5FA]" />
            <p className="text-sm text-[#CBD5E1] mt-2">Scroll to begin your journey</p>
          </div>
        </div>
      </section>
      
      {/* SECTION 2: Animated Energy Flow Begins */}
      <section ref={energyRef} className="relative py-20 min-h-[50vh] flex items-center bg-[#0F172A]/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#F8FAFC] mb-6">
              The <span className="text-[#FACC15]">StudyHike</span> Difference
            </h2>
            
            <p className="text-xl text-[#CBD5E1] max-w-3xl mx-auto mb-8">
              Our proven methodology combines personalized mentorship, strategic planning, and continuous motivation to transform your academic journey.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
              <ScrollAnimation animation="fade-up" delay={200}>
                <div className="bg-[#0F172A]/50 p-5 rounded-lg border border-[#60A5FA]/30">
                  <div className="w-12 h-12 rounded-full bg-[#60A5FA]/20 flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-6 w-6 text-[#60A5FA]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#F8FAFC] mb-2">Expert Mentorship</h3>
                  <p className="text-sm text-[#CBD5E1]">Learn from mentors who understand the JEE/NEET journey and can guide you effectively.</p>
                </div>
              </ScrollAnimation>
              
              <ScrollAnimation animation="fade-up" delay={300}>
                <div className="bg-[#0F172A]/50 p-5 rounded-lg border border-[#FACC15]/30">
                  <div className="w-12 h-12 rounded-full bg-[#FACC15]/20 flex items-center justify-center mx-auto mb-4">
                    <Target className="h-6 w-6 text-[#FACC15]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#F8FAFC] mb-2">Strategic Planning</h3>
                  <p className="text-sm text-[#CBD5E1]">Follow a customized study plan that targets your weak areas and optimizes your preparation.</p>
                </div>
              </ScrollAnimation>
              
              <ScrollAnimation animation="fade-up" delay={400}>
                <div className="bg-[#0F172A]/50 p-5 rounded-lg border border-[#A855F7]/30">
                  <div className="w-12 h-12 rounded-full bg-[#A855F7]/20 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-6 w-6 text-[#A855F7]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#F8FAFC] mb-2">Continuous Growth</h3>
                  <p className="text-sm text-[#CBD5E1]">Track your progress with detailed analytics and stay motivated throughout your journey.</p>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </div>
        
        {/* Energy Flow Line - Connects all sections */}
        <div className="absolute left-0 right-0 top-0 bottom-0 z-0">
          <EnergyFlow 
            active={energyFlowActive} 
            color="#60A5FA" 
            pulseCount={7} 
            variant="blue" 
          />
        </div>
      </section>
      
      {/* SECTION 3: Transformation Journey - Problems to Solutions */}
      <section ref={transformationRef} className="relative py-20 bg-[#0F172A]/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollAnimation animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-[#F8FAFC] mb-6">
                Your <span className="text-[#FACC15]">Transformation</span> Journey
              </h2>
              <p className="text-xl text-[#CBD5E1] max-w-3xl mx-auto">
                From struggling with concepts to mastering your exams - we guide you every step of the way
              </p>
            </div>
          </ScrollAnimation>

          {/* STEP 1: Problems Section */}
          <div className="mb-24 relative">
            <ScrollAnimation animation="fade-up" delay={200}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#7E22CE]/20 mb-4">
                  <AlertTriangle className="h-8 w-8 text-[#7E22CE]" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-[#F8FAFC] mb-2">Common Challenges</h3>
                <p className="text-[#CBD5E1] max-w-2xl mx-auto">Are you facing these obstacles in your JEE/NEET preparation?</p>
              </div>
            </ScrollAnimation>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="relative">
                <ScrollAnimation animation="fade-right" delay={300}>
                  <div className="bg-gradient-to-br from-[#7E22CE]/20 to-[#7E22CE]/10 p-6 rounded-lg border border-[#7E22CE]/30 shadow-lg h-full">
                    <div className="space-y-5">
                      {/* Problem 1 */}
                      <div className="flex items-start">
                        <div className="mt-1 flex-shrink-0 mr-4">
                          <X className="h-6 w-6 text-[#7E22CE]" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-[#F8FAFC] mb-1">Declining Test Scores</h4>
                          <p className="text-[#CBD5E1] mb-3">Despite hours of studying, your mock test scores aren't improving or are actually getting worse.</p>
                          <div className="py-2 px-3 text-sm w-full bg-[#0F172A]/50 rounded-md border-l-2 border-[#7E22CE]/50">
                            <span className="text-[#CBD5E1]">Without proper analysis, you can't identify what's holding you back.</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Problem 2 */}
                      <div className="flex items-start">
                        <div className="mt-1 flex-shrink-0 mr-4">
                          <X className="h-6 w-6 text-[#7E22CE]" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-[#F8FAFC] mb-1">Overwhelming Syllabus</h4>
                          <p className="text-[#CBD5E1] mb-3">The vast JEE/NEET syllabus feels impossible to complete, and you don't know where to focus.</p>
                          <div className="py-2 px-3 text-sm w-full bg-[#0F172A]/50 rounded-md border-l-2 border-[#7E22CE]/50">
                            <span className="text-[#CBD5E1]">Without prioritization, you waste time on less important topics.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollAnimation>
              </div>

              <div className="relative">
                <ScrollAnimation animation="fade-left" delay={400}>
                  <div className="bg-gradient-to-br from-[#7E22CE]/20 to-[#7E22CE]/10 p-6 rounded-lg border border-[#7E22CE]/30 shadow-lg h-full">
                    <div className="space-y-5">
                      {/* Problem 3 */}
                      <div className="flex items-start">
                        <div className="mt-1 flex-shrink-0 mr-4">
                          <X className="h-6 w-6 text-[#7E22CE]" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-[#F8FAFC] mb-1">No Clear Strategy</h4>
                          <p className="text-[#CBD5E1] mb-3">You study hard but lack a structured approach to tackle the exam effectively.</p>
                          <div className="py-2 px-3 text-sm w-full bg-[#0F172A]/50 rounded-md border-l-2 border-[#7E22CE]/50">
                            <span className="text-[#CBD5E1]">Random studying without a plan leads to gaps in knowledge.</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Problem 4 */}
                      <div className="flex items-start">
                        <div className="mt-1 flex-shrink-0 mr-4">
                          <X className="h-6 w-6 text-[#7E22CE]" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-[#F8FAFC] mb-1">Constant Anxiety</h4>
                          <p className="text-[#CBD5E1] mb-3">Stress and anxiety about the exam are affecting your concentration and sleep.</p>
                          <div className="py-2 px-3 text-sm w-full bg-[#0F172A]/50 rounded-md border-l-2 border-[#7E22CE]/50">
                            <span className="text-[#CBD5E1]">Mental pressure reduces your ability to retain information.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollAnimation>
              </div>
            </div>

            {/* Student Visualization - Sad State */}
            <div className="mt-12 flex justify-center">
              <ScrollAnimation animation="fade-up" delay={500}>
                <div className="w-full max-w-md">
                  <SciFiStudent state="sad" showScreens={true} />
                </div>
              </ScrollAnimation>
            </div>

            {/* Downward Arrow */}
            <div className="flex justify-center my-16">
              <ScrollAnimation animation="fade-up" delay={600}>
                <div className="flex flex-col items-center">
                  <ArrowDown className="h-12 w-12 text-[#FACC15] animate-bounce" />
                  <p className="text-[#CBD5E1] mt-2 font-medium">StudyHike Solutions</p>
                </div>
              </ScrollAnimation>
            </div>
          </div>

          {/* STEP 2: Solutions Section */}
          <div className="relative">
            <ScrollAnimation animation="fade-up" delay={700}>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#10B981]/20 mb-4">
                  <Lightbulb className="h-8 w-8 text-[#10B981]" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-[#F8FAFC] mb-2">Our Solutions</h3>
                <p className="text-[#CBD5E1] max-w-2xl mx-auto">Here's how StudyHike transforms your preparation journey</p>
              </div>
            </ScrollAnimation>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="relative">
                <ScrollAnimation animation="fade-right" delay={800}>
                  <div className="bg-gradient-to-br from-[#10B981]/20 to-[#10B981]/10 p-6 rounded-lg border border-[#10B981]/30 shadow-lg h-full">
                    <div className="space-y-5">
                      {/* Solution 1 */}
                      <div className="flex items-start">
                        <div className="mt-1 flex-shrink-0 mr-4">
                          <CheckCircle className="h-6 w-6 text-[#10B981]" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-[#F8FAFC] mb-1">Personalized Test Analysis</h4>
                          <p className="text-[#CBD5E1] mb-3">Our mentors analyze your test performance to identify specific weak areas and knowledge gaps.</p>
                          <div className="py-2 px-3 text-sm w-full bg-[#0F172A]/50 rounded-md border-l-2 border-[#10B981]/50">
                            <span className="text-[#CBD5E1]">By targeting your specific weaknesses, we help you improve scores by 15-20% within weeks.</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Solution 2 */}
                      <div className="flex items-start">
                        <div className="mt-1 flex-shrink-0 mr-4">
                          <CheckCircle className="h-6 w-6 text-[#10B981]" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-[#F8FAFC] mb-1">Strategic Study Planning</h4>
                          <p className="text-[#CBD5E1] mb-3">We create a customized study schedule that prioritizes high-yield topics and optimizes your study time.</p>
                          <div className="py-2 px-3 text-sm w-full bg-[#0F172A]/50 rounded-md border-l-2 border-[#10B981]/50">
                            <span className="text-[#CBD5E1]">Our structured approach ensures complete syllabus coverage while focusing on your weak areas.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollAnimation>
              </div>

              <div className="relative">
                <ScrollAnimation animation="fade-left" delay={900}>
                  <div className="bg-gradient-to-br from-[#10B981]/20 to-[#10B981]/10 p-6 rounded-lg border border-[#10B981]/30 shadow-lg h-full">
                    <div className="space-y-5">
                      {/* Solution 3 */}
                      <div className="flex items-start">
                        <div className="mt-1 flex-shrink-0 mr-4">
                          <CheckCircle className="h-6 w-6 text-[#10B981]" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-[#F8FAFC] mb-1">Expert Mentorship</h4>
                          <p className="text-[#CBD5E1] mb-3">Connect with experienced mentors who provide personalized guidance and clear your doubts.</p>
                          <div className="py-2 px-3 text-sm w-full bg-[#0F172A]/50 rounded-md border-l-2 border-[#10B981]/50">
                            <span className="text-[#CBD5E1]">Our mentors have helped 1000+ students achieve their dream ranks in JEE/NEET.</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Solution 4 */}
                      <div className="flex items-start">
                        <div className="mt-1 flex-shrink-0 mr-4">
                          <CheckCircle className="h-6 w-6 text-[#10B981]" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-[#F8FAFC] mb-1">Motivation & Accountability</h4>
                          <p className="text-[#CBD5E1] mb-3">Regular check-ins and progress tracking keep you motivated and accountable.</p>
                          <div className="py-2 px-3 text-sm w-full bg-[#0F172A]/50 rounded-md border-l-2 border-[#10B981]/50">
                            <span className="text-[#CBD5E1]">Our positive reinforcement approach reduces anxiety and builds confidence.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollAnimation>
              </div>
            </div>

            {/* Student Visualization - Happy State */}
            <div className="mt-12 flex justify-center">
              <ScrollAnimation animation="fade-up" delay={1000}>
                <div className="w-full max-w-md">
                  <SciFiStudent state="happy" showScreens={true} />
                </div>
              </ScrollAnimation>
            </div>

            {/* CTA Button */}
            <div className="flex justify-center mt-16">
              <ScrollAnimation animation="fade-up" delay={1100}>
                <SciFiButton 
                  variant="default" 
                  size="lg"
                  className="group"
                  onClick={() => {
                    // Smooth scroll to plans section
                    plansRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  withSound={true}
                >
                  Start Your Transformation
                  <ArrowDown className="ml-2 h-5 w-5 group-hover:animate-bounce" />
                </SciFiButton>
              </ScrollAnimation>
            </div>
          </div>
        </div>
      </section>
      
      {/* SECTION 4: Plans Cards */}
      <section ref={plansRef} id="plans" className="py-20 bg-[#0F172A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollAnimation animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-[#F8FAFC] mb-6">
                Choose Your <span className="text-[#FACC15]">Success Path</span>
              </h2>
              
              <p className="text-xl text-[#CBD5E1] max-w-3xl mx-auto">
                Select the program that matches your academic goals and learning needs
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* FREE PLAN */}
            <ScrollAnimation animation="fade-up" delay={200}>
              <div className="bg-gradient-to-br from-[#1E3A8A] to-[#1E3A8A]/80 rounded-xl overflow-hidden border border-[#60A5FA]/30 shadow-lg transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[#60A5FA]/20 hover:shadow-xl group">
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-[#F8FAFC] mb-2">FREE PLAN</h3>
                  <p className="text-[#CBD5E1] mb-6 text-lg">Basic access to get started</p>
                  
                  <div className="text-3xl font-bold text-[#F8FAFC] mb-6">Free</div>
                  
                  <ul className="space-y-4 mb-8">
                    {[
                      '15-minute meetings (8/month)',
                      'Homework submission',
                      'Basic progress reports',
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-[#60A5FA]" />
                        <span className="text-[#CBD5E1] text-lg">
                          {feature}
                        </span>
                      </li>
                    ))}
                    
                    {[
                      'Limited test analysis',
                      'Basic study materials',
                      'Email support',
                      'Group doubt sessions',
                      'Basic concept explanations',
                      'Monthly progress review'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <X className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-gray-500" />
                        <span className="text-gray-500 text-lg line-through">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <SciFiButton 
                    variant="default" 
                    className="w-full justify-center group-hover:bg-[#60A5FA]/20"
                    onClick={() => handlePlanSelect("Free")}
                    withSound={true}
                  >
                    Join Now
                  </SciFiButton>
                </div>
              </div>
            </ScrollAnimation>
            
            {/* PRO PLAN */}
            <ScrollAnimation animation="fade-up" delay={400}>
              <div className="bg-gradient-to-br from-[#047857] to-[#047857]/80 rounded-xl overflow-hidden border border-[#10B981]/30 shadow-lg transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[#10B981]/20 hover:shadow-xl group relative">
                <div className="absolute -right-10 top-6 bg-[#10B981] text-white py-1 px-10 transform rotate-45 text-sm font-medium z-10">
                  POPULAR
                </div>
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-[#F8FAFC] mb-2">PRO PLAN</h3>
                  <p className="text-[#CBD5E1] mb-6 text-lg">Comprehensive support</p>
                  
                  <div className="text-3xl font-bold text-[#F8FAFC] mb-6">₹199</div>
                  
                  <ul className="space-y-4 mb-8">
                    {/* Active Features */}
                    {[
                      '20–25 minute meetings (12/month)',
                      'Homework submission & feedback',
                      'Detailed test analysis',
                      'Premium study materials',
                      'Priority email support',
                      'Weekly progress reports'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-[#10B981]" />
                        <span className="text-[#CBD5E1] text-lg">
                          {feature}
                        </span>
                      </li>
                    ))}
                    
                    {/* Inactive Features */}
                    {[
                      'Student-initiated meetings',
                      'Daily motivation content',
                      'Full progress dashboard'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <X className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-gray-500" />
                        <span className="text-gray-500 text-lg line-through">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <SciFiButton 
                    variant="warning" 
                    className="w-full justify-center group-hover:bg-[#10B981]/20"
                    onClick={() => handlePlanSelect("Pro")}
                    withSound={true}
                  >
                    Join Now
                  </SciFiButton>
                </div>
              </div>
            </ScrollAnimation>
            
            {/* PREMIUM PLAN */}
            <ScrollAnimation animation="fade-up" delay={600}>
              <div className="bg-gradient-to-br from-[#7E22CE] to-[#7E22CE]/80 rounded-xl overflow-hidden border border-[#A855F7]/30 shadow-lg transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[#A855F7]/20 hover:shadow-xl group">
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-[#F8FAFC] mb-2">PREMIUM PLAN</h3>
                  <p className="text-[#CBD5E1] mb-6 text-lg">Elite preparation package</p>
                  
                  <div className="text-3xl font-bold text-[#F8FAFC] mb-6">₹499</div>
                  
                  <ul className="space-y-4 mb-8">
                    {/* All PRO features included */}
                    <li className="flex items-start">
                      <CheckCircle className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-[#A855F7]" />
                      <span className="text-[#CBD5E1] text-lg font-medium">
                        All PRO features included, plus:
                      </span>
                    </li>
                    
                    {/* Premium-exclusive features */}
                    {[
                      '30-minute meetings (unlimited)',
                      'Personalized study plans',
                      'Student-initiated meetings',
                      'Daily motivation content',
                      'Full progress dashboard',
                      'Direct mentor WhatsApp access',
                      'Mock test creation & analysis',
                      'Subject-specific strategy sessions',
                      'Exam day preparation guidance'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-[#A855F7]" />
                        <span className="text-[#CBD5E1] text-lg">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <SciFiButton 
                    variant="attack" 
                    className="w-full justify-center group-hover:bg-[#A855F7]/20"
                    onClick={() => handlePlanSelect("Premium")}
                    withSound={true}
                  >
                    Join Now
                  </SciFiButton>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>
      
      {/* SECTION 5: Result Section */}
      <section ref={resultRef} className="py-20 bg-[#0F172A]/90 text-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimation animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                <span className="text-[#FACC15]">The Result</span>
              </h2>
              <p className="text-2xl text-[#CBD5E1]">
                With StudyHike: <span className="text-[#60A5FA] font-medium">Clarity.</span> <span className="text-[#10B981] font-medium">Progress.</span> <span className="text-[#A855F7] font-medium">Confidence.</span>
              </p>
            </div>
          </ScrollAnimation>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <ScrollAnimation animation="fade-right" delay={300}>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="mt-1 flex-shrink-0 bg-[#60A5FA]/20 p-3 rounded-full">
                    <Brain className="h-6 w-6 text-[#60A5FA]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Strategic Learning</h3>
                    <p className="text-[#CBD5E1]">Our proven methodology adapts to your learning style, helping you master concepts faster and retain information longer.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="mt-1 flex-shrink-0 bg-[#10B981]/20 p-3 rounded-full">
                    <Target className="h-6 w-6 text-[#10B981]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Targeted Preparation</h3>
                    <p className="text-[#CBD5E1]">Identify and strengthen weak areas with targeted practice and expert guidance that builds deep understanding.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="mt-1 flex-shrink-0 bg-[#A855F7]/20 p-3 rounded-full">
                    <Activity className="h-6 w-6 text-[#A855F7]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Continuous Growth</h3>
                    <p className="text-[#CBD5E1]">Monitor your progress with detailed analytics and personalized feedback that keeps you motivated and on track.</p>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
            
            <ScrollAnimation animation="fade-left" delay={500}>
              <div className="relative flex justify-center items-center">
                {/* Rotating gear/circuit behind the student */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 rounded-full border border-[#60A5FA]/30 animate-gentle-pulse"></div>
                  <div className="absolute w-48 h-48 rounded-full border border-[#10B981]/30 animate-gentle-pulse" style={{animationDelay: "0.5s"}}></div>
                  <div className="absolute w-32 h-32 rounded-full border border-[#A855F7]/30 animate-gentle-pulse" style={{animationDelay: "1s"}}></div>
                  
                  {/* Rotating gear */}
                  <div className="absolute w-72 h-72 animate-slow-spin opacity-20">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                      <path d="M50 0 L54 10 L64 4 L62 15 L74 14 L66 22 L78 26 L66 30 L74 38 L62 37 L64 48 L54 42 L50 52 L46 42 L36 48 L38 37 L26 38 L34 30 L22 26 L34 22 L26 14 L38 15 L36 4 L46 10 Z" fill="none" stroke="#FACC15" strokeWidth="0.5" />
                      <path d="M50 10 L53 17 L60 13 L58 21 L67 20 L61 26 L70 29 L61 32 L67 38 L58 37 L60 45 L53 41 L50 48 L47 41 L40 45 L42 37 L33 38 L39 32 L30 29 L39 26 L33 20 L42 21 L40 13 L47 17 Z" fill="none" stroke="#60A5FA" strokeWidth="0.5" />
                      <circle cx="50" cy="50" r="5" fill="none" stroke="#A855F7" strokeWidth="0.5" />
                    </svg>
                  </div>
                </div>
                
                {/* Happy Student Animation */}
                <div className="w-full max-w-md relative z-10">
                  <SciFiStudent state="happy" showScreens={true} />
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>
      
      {/* SECTION 6: Testimonials Slider (Optional) */}
      <section className="py-16 bg-[#0F172A]/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimation animation="fade-up">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-[#F8FAFC] mb-4">
                Success Stories
              </h2>
            </div>
            
            <div className="bg-[#1E293B] p-6 rounded-lg border border-[#60A5FA]/20 max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-[#60A5FA]/20 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="h-10 w-10 text-[#60A5FA]" />
                </div>
                <div>
                  <p className="text-[#CBD5E1] mb-4 text-lg italic">
                    "StudyHike transformed my approach to JEE preparation. The structured guidance and constant support helped me overcome my weaknesses and build confidence. I went from struggling to ranking in the top percentile!"
                  </p>
                  <div className="font-bold text-[#F8FAFC]">Aarav Singh</div>
                  <div className="text-[#60A5FA] text-sm">JEE Advanced AIR 876</div>
                </div>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>
      
      {/* SECTION 7: Footer */}
      <footer className="py-12 bg-[#0F172A] border-t border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold text-[#F8FAFC] mb-4">StudyHike</h3>
              <p className="text-[#94A3B8] text-sm mb-4">Transforming JEE/NEET aspirants into confident achievers.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-[#60A5FA] hover:text-[#FACC15]">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-[#60A5FA] hover:text-[#FACC15]">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-[#60A5FA] hover:text-[#FACC15]">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-[#F8FAFC] mb-4">Quick Links</h3>
              <ul className="space-y-2 text-[#94A3B8]">
                <li><a href="#" className="hover:text-[#FACC15]">About</a></li>
                <li><a href="#" className="hover:text-[#FACC15]">Features</a></li>
                <li><a href="#" className="hover:text-[#FACC15]">Pricing</a></li>
                <li><a href="#" className="hover:text-[#FACC15]">Testimonials</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-[#F8FAFC] mb-4">Resources</h3>
              <ul className="space-y-2 text-[#94A3B8]">
                <li><a href="#" className="hover:text-[#FACC15]">Study Materials</a></li>
                <li><a href="#" className="hover:text-[#FACC15]">Mock Tests</a></li>
                <li><a href="#" className="hover:text-[#FACC15]">Blog</a></li>
                <li><a href="#" className="hover:text-[#FACC15]">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-[#F8FAFC] mb-4">Contact</h3>
              <ul className="space-y-2 text-[#94A3B8]">
                <li>support@studyhike.com</li>
                <li>+91 98765 43210</li>
                <li>Bangalore, India</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-[#334155] flex flex-col md:flex-row justify-between items-center">
            <p className="text-[#94A3B8] text-sm">© 2023 StudyHike. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-[#94A3B8] text-sm hover:text-[#FACC15]">Terms</a>
              <a href="#" className="text-[#94A3B8] text-sm hover:text-[#FACC15]">Privacy</a>
              <a href="#" className="text-[#94A3B8] text-sm hover:text-[#FACC15]">Contact</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Student Success Modal */}
      {showOnboardingModal && (
        <div className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-[#60A5FA] opacity-30 animate-gentle-pulse"></div>
            <div className="absolute top-1/3 left-1/2 w-5 h-5 rounded-full bg-[#FACC15] opacity-20 animate-gentle-pulse" style={{animationDelay: "0.5s"}}></div>
            <div className="absolute top-2/3 left-1/3 w-4 h-4 rounded-full bg-[#60A5FA] opacity-30 animate-gentle-pulse" style={{animationDelay: "0.7s"}}></div>
            <div className="absolute top-1/2 left-3/4 w-6 h-6 rounded-full bg-[#FACC15] opacity-20 animate-gentle-pulse" style={{animationDelay: "1.1s"}}></div>
          </div>
          
          <OnboardingForm 
            onClose={() => setShowOnboardingModal(false)}
            onSubmit={handleFormSubmit}
            planName={selectedPlan || undefined}
          />
        </div>
      )}
    </div>
  )
}