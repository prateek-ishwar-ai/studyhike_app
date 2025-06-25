"use client"

import React, { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useChunkedLoading } from "@/hooks/use-chunked-loading";
import { ChunkedLoader } from "@/components/ui/chunked-loader";
import { MobileAppLayout, useIsNativeApp } from "@/components/ui/mobile-app-layout";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Smartphone, ArrowRight, BookOpen, Users, Target } from "lucide-react";

export default function NewHomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [energyPosition, setEnergyPosition] = useState(0);
  const { isLoading, progress } = useChunkedLoading({
    totalChunks: 5,
    initialDelay: 100,
    chunkDelay: 150
  });
  
  const router = useRouter();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const isNativeApp = useIsNativeApp();

  // If mobile app and user is authenticated, redirect to dashboard
  useEffect(() => {
    if (isNativeApp && user && profile) {
      const dashboardPath = profile.role === 'student' 
        ? '/student/dashboard' 
        : profile.role === 'mentor' 
          ? '/mentor/dashboard' 
          : '/admin/dashboard';
      
      router.push(dashboardPath);
    } else if (isNativeApp && !user) {
      // If mobile app but not authenticated, redirect to login
      router.push('/auth/login');
    }
  }, [isNativeApp, user, profile, router]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      // Calculate energy position based on scroll
      const journeySection = document.getElementById('journey');
      if (journeySection) {
        const rect = journeySection.getBoundingClientRect();
        const sectionTop = journeySection.offsetTop;
        const sectionHeight = journeySection.offsetHeight;
        
        // Calculate relative position within the journey section
        const relativeScroll = Math.max(0, currentScrollY - sectionTop + window.innerHeight);
        const maxScroll = sectionHeight + window.innerHeight;
        const progress = Math.min(1, Math.max(0, relativeScroll / maxScroll));
        
        setEnergyPosition(progress);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show mobile app login prompt for mobile users who aren't logged in
  if (isMobile && !user) {
    return (
      <MobileAppLayout title="StudyHike" showStatusBar={true}>
        <div className="min-h-screen bg-gradient-to-br from-[#0C0E19] via-[#111420] to-[#0C0E19] flex flex-col items-center justify-center px-6">
          {/* Mobile App Welcome */}
          <motion.div 
            className="text-center space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* App Logo */}
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-4 rounded-2xl shadow-2xl">
                <span role="img" aria-label="bulb" className="text-3xl">💡</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
                  StudyHike
                </h1>
                <p className="text-gray-400 text-sm">Your Study Companion</p>
              </div>
            </div>

            {/* Mobile App Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3 text-left">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Personalized Learning</h3>
                  <p className="text-gray-400 text-sm">Get customized study plans for JEE/NEET prep</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 text-left">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Expert Mentorship</h3>
                  <p className="text-gray-400 text-sm">Connect with experienced mentors anytime</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 text-left">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <Target className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Track Progress</h3>
                  <p className="text-gray-400 text-sm">Monitor your improvement with detailed analytics</p>
                </div>
              </div>
            </div>

            {/* Mobile CTA */}
            <div className="space-y-4 w-full max-w-sm">
              <Link href="/auth/login">
                <Button className="w-full h-12 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold text-base shadow-lg hover:shadow-xl transition-all duration-200">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <p className="text-gray-400 text-sm">
                Join thousands of students achieving their dreams
              </p>
            </div>

            {/* Mobile App Badge */}
            <div className="flex items-center justify-center space-x-2 mt-8 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Smartphone className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-blue-400 font-medium">Native Mobile App Experience</span>
            </div>
          </motion.div>
        </div>
      </MobileAppLayout>
    );
  }

  return (
    <main className="bg-[#0C0E19] text-white min-h-screen font-sans relative overflow-hidden">
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            className="fixed inset-0 bg-[#0C0E19] flex flex-col items-center justify-center z-50"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <LoadingSpinner 
              animation="sci-fi" 
              color="yellow" 
              size="lg" 
              text="Loading StudyHike" 
              showProgress={true} 
              progress={progress} 
            />
            <motion.p 
              className="text-gray-400 mt-8 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Preparing your academic journey...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
      
      <ChunkedLoader
        chunkSize={2}
        initialDelay={100}
        chunkDelay={150}
        color="yellow"
        loadingAnimation="sci-fi"
        loadingText="Loading StudyHike"
        showLoadingOverlay={false}
        priority={[
          <motion.nav 
            key="navbar"
            className="flex justify-between items-center px-8 py-6 bg-[#0C0E19] shadow relative z-40"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: isLoading ? 2.5 : 0 }}
          >
            <div className="flex items-center space-x-3">
              <div className="bg-orange-500 p-3 rounded-lg">
                <span role="img" aria-label="bulb" className="text-2xl">💡</span>
              </div>
              <div>
                <h1 className="text-orange-500 font-bold text-2xl">StudyHike</h1>
                <p className="text-base text-gray-400">Clarity Over Chaos. Calm Over Pressure.</p>
              </div>
            </div>
            <div className="flex space-x-8 items-center text-lg">
              <a href="#journey" className="hover:text-yellow-400 transition-colors font-medium">The Journey</a>
              <a href="#plans" className="hover:text-yellow-400 transition-colors font-medium">Plans</a>
              <a href="#stories" className="hover:text-yellow-400 transition-colors font-medium">Success Stories</a>
              <Link href="/auth/login">
                <motion.button 
                  className="bg-yellow-400 text-[#0C0E19] px-6 py-2 rounded-lg hover:shadow-lg transition-all font-bold text-lg"
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(250, 204, 21, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  🔐 Login
                </motion.button>
              </Link>
            </div>
          </motion.nav>
        ]}
      >
        {/* Hero Section */}
        <motion.section 
          className="text-center py-24 px-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-6xl md:text-7xl font-bold text-gray-300 leading-tight">
            Feeling{" "}
            <motion.span 
              className="text-red-500 inline-block"
              animate={{ 
                scale: [1, 1.15, 0.95, 1.05, 1],
                rotateZ: [0, -0.8, 0.8, -0.4, 0],
                textShadow: [
                  "0 0 0px #ef4444",
                  "0 0 40px #ef4444, 0 0 80px #ef4444",
                  "0 0 15px #ef4444",
                  "0 0 50px #ef4444, 0 0 100px #ef4444",
                  "0 0 0px #ef4444"
                ]
              }}
              transition={{ 
                duration: 5.5, // Slowed down from 3 to 5.5 seconds
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut"
              }}
            >
              STUCK?
            </motion.span>
          </h2>
          <motion.p 
            className="text-2xl text-gray-400 mt-8 max-w-4xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Every JEE/NEET aspirant knows this feeling. Endless study hours, declining scores, mounting pressure.{" "}
            <span className="text-yellow-400 font-bold text-2xl">You're not alone.</span>
          </motion.p>
          <motion.div 
            className="mt-10 text-yellow-400 font-medium text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            ↓<br />There's a way out
          </motion.div>
        </motion.section>

        {/* Breakthrough Section */}
        <motion.section 
          className="bg-[#111420] p-12 text-center rounded-2xl mx-6 md:mx-32 my-12"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2 
            className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-green-400"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            BREAKTHROUGH
          </motion.h2>
          <motion.p 
            className="text-gray-300 mt-8 max-w-4xl mx-auto text-xl leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            StudyHike is your companion through JEE's struggle — helping you stay calm, stay focused, and move with purpose. 
            Transform your academic chaos into focused success with our expert mentorship and proven strategies.
          </motion.p>
          <motion.div 
            className="mt-10 flex flex-col sm:flex-row justify-center space-y-6 sm:space-y-0 sm:space-x-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <Link href="/auth/signup">
              <motion.button 
                className="bg-yellow-400 hover:bg-yellow-300 text-[#0C0E19] px-8 py-4 rounded-lg font-bold transition-all text-lg"
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(250, 204, 21, 0.5)" }}
                whileTap={{ scale: 0.95 }}
              >
                Break Free Now →
              </motion.button>
            </Link>
            <a href="#stories">
              <motion.button 
                className="border-2 border-green-300 text-green-300 px-8 py-4 rounded-lg hover:bg-green-300 hover:text-[#0C0E19] transition-all text-lg font-medium"
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(34, 197, 94, 0.5)" }}
                whileTap={{ scale: 0.95 }}
              >
                ▶ See Transformations
              </motion.button>
            </a>
          </motion.div>
        </motion.section>

        {/* Journey Timeline with Pipe System */}
        <motion.section 
          id="journey" 
          className="py-20 px-6 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.h2 
            className="text-center text-5xl md:text-6xl font-bold text-gray-300"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            Student Transformation <span className="text-green-400">Journey</span>
          </motion.h2>
          <motion.p 
            className="text-center text-gray-400 mt-6 max-w-4xl mx-auto text-xl leading-relaxed"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Follow the proven path from academic struggle to breakthrough success. Our comprehensive mentorship system 
            guides you through every step of your transformation journey.
          </motion.p>

        {/* Pipe System with Energy Flow */}
        <div className="absolute left-1/2 transform -translate-x-1/2 top-40 bottom-0 w-10 z-10">
          {/* Pipe Background */}
          <div className="w-full h-full bg-gradient-to-b from-gray-600 via-gray-700 to-gray-600 rounded-full shadow-inner relative">
            {/* Inner pipe glow */}
            <div className="absolute inset-1 bg-gradient-to-b from-blue-900/30 via-purple-900/30 to-green-900/30 rounded-full"></div>
            
            {/* Energy Orb */}
            <motion.div
              className="absolute w-8 h-8 bg-yellow-400 rounded-full left-1/2 transform -translate-x-1/2 shadow-lg"
              style={{
                boxShadow: "0 0 25px #facc15, 0 0 50px #facc15, 0 0 75px #facc15",
                top: `${energyPosition * 85}%`,
              }}
              animate={{
                boxShadow: [
                  "0 0 25px #facc15, 0 0 50px #facc15",
                  "0 0 35px #facc15, 0 0 70px #facc15, 0 0 105px #facc15",
                  "0 0 25px #facc15, 0 0 50px #facc15"
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Pipe segments indicators */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-500 rounded-full"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full"></div>
          </div>
        </div>

        {/* Timeline steps */}
        <div className="mt-16 flex flex-col items-center space-y-12 max-w-5xl mx-auto relative z-20">
          {/* Step 1 - Stuck Student */}
          <motion.div 
            className="bg-red-900/30 border border-red-500/50 p-8 rounded-xl w-full max-w-2xl text-left relative"
            initial={{ x: -100, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              boxShadow: energyPosition > 0.1 ? [
                "0 0 0px rgba(239, 68, 68, 0.3)",
                "0 0 40px rgba(239, 68, 68, 0.6)",
                "0 0 0px rgba(239, 68, 68, 0.3)"
              ] : undefined
            }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="absolute -left-10 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-red-500 rounded-full shadow-lg"></div>
            <h3 className="text-red-400 text-2xl font-bold flex items-center gap-3 mb-4">
              <span role="img" aria-label="worried" className="text-3xl">😰</span> STUCK STUDENT
            </h3>
            <p className="text-lg text-gray-400 mb-6">The Starting Point</p>
            <ul className="list-disc ml-8 text-red-300 text-lg space-y-2">
              <li>Declining mock scores despite hours of study</li>
              <li>No clear strategy or direction</li>
              <li>Overwhelming syllabus with no prioritization</li>
              <li>Constant anxiety and mounting pressure</li>
            </ul>
          </motion.div>

          {/* Step 2 - Guided Learning */}
          <motion.div 
            className="bg-yellow-900/30 border border-yellow-500/50 p-8 rounded-xl w-full max-w-2xl text-left relative"
            initial={{ x: 100, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              boxShadow: energyPosition > 0.5 ? [
                "0 0 0px rgba(250, 204, 21, 0.3)",
                "0 0 40px rgba(250, 204, 21, 0.6)",
                "0 0 0px rgba(250, 204, 21, 0.3)"
              ] : undefined
            }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="absolute -right-10 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-yellow-500 rounded-full shadow-lg"></div>
            <h3 className="text-yellow-400 text-2xl font-bold flex items-center gap-3 mb-4">
              <span role="img" aria-label="target" className="text-3xl">🎯</span> GUIDED LEARNING
            </h3>
            <p className="text-lg text-gray-400 mb-6">The Transformation</p>
            <ul className="list-disc ml-8 text-yellow-300 text-lg space-y-2">
              <li>Personal mentor assigned for dedicated support</li>
              <li>Strategic study planning with clear priorities</li>
              <li>Regular progress tracking and course corrections</li>
              <li>Expert test analysis with actionable insights</li>
            </ul>
          </motion.div>

          {/* Step 3 - Success Achieved */}
          <motion.div 
            className="bg-green-900/30 border border-green-500/50 p-8 rounded-xl w-full max-w-2xl text-left relative"
            initial={{ x: -100, opacity: 0 }}
            animate={{ 
              x: 0, 
              opacity: 1,
              boxShadow: energyPosition > 0.8 ? [
                "0 0 0px rgba(34, 197, 94, 0.3)",
                "0 0 50px rgba(34, 197, 94, 0.8)",
                "0 0 0px rgba(34, 197, 94, 0.3)"
              ] : undefined,
              scale: energyPosition > 0.8 ? [1, 1.02, 1] : undefined
            }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="absolute -left-10 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-green-500 rounded-full shadow-lg"></div>
            <h3 className="text-green-400 text-2xl font-bold flex items-center gap-3 mb-4">
              <span role="img" aria-label="success" className="text-3xl">🎯</span> SUCCESS ACHIEVED
            </h3>
            <p className="text-lg text-gray-400 mb-6">The Breakthrough</p>
            <ul className="list-disc ml-8 text-green-300 text-lg space-y-2">
              <li>Target rank achieved with confidence</li>
              <li>Dream college admission secured</li>
              <li>Confident problem-solving abilities developed</li>
              <li>Consistent improvement and sustained motivation</li>
            </ul>
          </motion.div>
        </div>
        </motion.section>
      </ChunkedLoader>

      {/* Pricing Section */}
      <motion.section 
        id="plans" 
        className="py-24 px-6 bg-[#0C0E19] text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.h2 
          className="text-5xl md:text-6xl font-bold text-gray-200 mb-12"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          Choose Your Plan
        </motion.h2>
        <motion.p 
          className="text-xl text-gray-400 mb-16 max-w-3xl mx-auto"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Select the perfect plan that matches your preparation needs and goals
        </motion.p>
        
        <div className="flex flex-col lg:flex-row justify-center gap-8 max-w-7xl mx-auto">
          {/* Free Plan */}
          <motion.div 
            className="bg-[#111827] p-8 rounded-2xl w-full lg:w-1/3 border border-blue-500/20 hover:border-blue-500/50 transition-all"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <h3 className="text-3xl font-bold text-blue-400 mb-2">Free Plan</h3>
            <p className="text-4xl font-bold text-blue-500 mt-4 mb-6">₹0</p>
            <p className="text-gray-400 mb-8 text-lg">Perfect for getting started</p>
            
            <div className="text-left space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">Auto-Scheduled Meetings (6-8/month)</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">Meeting Duration: 15 minutes</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">Email & Notification Reminders</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">Homework Upload & Review</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">Progress Tracking</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">Motivation Section</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-red-400 text-xl">❌</span>
                <span className="text-gray-500 text-lg">Test Score Analysis</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-red-400 text-xl">❌</span>
                <span className="text-gray-500 text-lg">Custom Study Plan</span>
              </div>
            </div>
            
            <Link href="/auth/signup">
              <motion.button 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-xl transition-all font-bold text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Free Journey
              </motion.button>
            </Link>
          </motion.div>

          {/* Pro Plan */}
          <motion.div 
            className="bg-[#1F2937] p-8 rounded-2xl w-full lg:w-1/3 border border-yellow-500/20 hover:border-yellow-500/50 transition-all relative"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-6 py-2 rounded-full text-lg font-bold">
              Most Popular
            </div>
            <h3 className="text-3xl font-bold text-yellow-400 mb-2">Pro Plan</h3>
            <p className="text-4xl font-bold text-yellow-500 mt-4 mb-6">₹199<span className="text-lg font-normal">/month</span></p>
            <p className="text-gray-400 mb-8 text-lg">Comprehensive support system</p>
            
            <div className="text-left space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">Auto-Scheduled Meetings (6-8/month)</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">Meeting Duration: 20-25 minutes</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">Test Score Upload & Analysis</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">Personalized Resources</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">Enhanced Mentor Support</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">All Free Plan Features</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-red-400 text-xl">❌</span>
                <span className="text-gray-500 text-lg">On-Request Meetings</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-red-400 text-xl">❌</span>
                <span className="text-gray-500 text-lg">Custom Study Plan</span>
              </div>
            </div>
            
            <Link href="/auth/signup">
              <motion.button 
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-[#0C0E19] px-6 py-4 rounded-xl transition-all font-bold text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Choose Pro Plan
              </motion.button>
            </Link>
          </motion.div>

          {/* Premium Plan */}
          <motion.div 
            className="bg-[#1C1F2A] p-8 rounded-2xl w-full lg:w-1/3 border border-green-500/20 hover:border-green-500/50 transition-all"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -5 }}
          >
            <h3 className="text-3xl font-bold text-green-400 mb-2">Premium Plan</h3>
            <p className="text-4xl font-bold text-green-500 mt-4 mb-6">₹499<span className="text-lg font-normal">/month</span></p>
            <p className="text-gray-400 mb-8 text-lg">Complete transformation package</p>
            
            <div className="text-left space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">On-Request Meetings (8/month)</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">Meeting Duration: 30 minutes</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">Custom Study Plan</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">Meeting Request Panel</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">Full Mentor Support (Chat + Meeting)</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">All Pro Plan Features</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-green-400 text-xl">✅</span>
                <span className="text-gray-300 text-lg">Priority Support</span>
              </div>
            </div>
            
            <Link href="/auth/signup">
              <motion.button 
                className="w-full bg-green-500 hover:bg-green-400 text-[#0C0E19] px-6 py-4 rounded-xl transition-all font-bold text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Go Premium
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section 
        id="stories" 
        className="py-24 px-6 bg-[#111420] text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.h2 
          className="text-5xl md:text-6xl font-bold text-gray-200 mb-12"
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          Success Stories
        </motion.h2>
        <motion.p 
          className="text-xl text-gray-400 mb-16 max-w-3xl mx-auto"
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          Real results from real students who transformed their JEE/NEET preparation with StudyHike
        </motion.p>
        
        <div className="flex flex-col lg:flex-row justify-center gap-8 max-w-6xl mx-auto">
          {[
            {
              text: "StudyHike helped me achieve my target rank when I was completely lost in my preparation strategy. The personalized guidance made all the difference.",
              name: "Manvinder",
              details: "JEE Mains Rank: 14,900",
              delay: 0.1
            },
            {
              text: "The regular mentoring sessions and test analysis helped me identify my weak areas and work on them systematically. Couldn't have done it without StudyHike.",
              name: "Anonymous Student",
              details: "JEE Advanced Rank: 26,000",
              delay: 0.2
            },
            {
              text: "From struggling with concepts to achieving 98 percentile - StudyHike transformed my entire approach to JEE preparation. The mentor support was incredible.",
              name: "Himanshu",
              details: "98 percentile in JEE Mains",
              delay: 0.3
            }
          ].map((testimonial, index) => (
            <motion.div 
              key={index}
              className="bg-gray-100 text-black p-8 rounded-xl w-full lg:w-1/3 hover:shadow-lg transition-all"
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: testimonial.delay }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <p className="italic mb-6 text-lg leading-relaxed">"{testimonial.text}"</p>
              <div className="font-bold text-xl">{testimonial.name}</div>
              <div className="text-lg text-gray-600 mt-2">{testimonial.details}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-[#0C0E19] border-t border-gray-800 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-orange-500 p-3 rounded-lg">
                  <span role="img" aria-label="bulb" className="text-2xl">💡</span>
                </div>
                <div>
                  <h3 className="text-orange-500 font-bold text-2xl">StudyHike</h3>
                  <p className="text-base text-gray-400">Clarity Over Chaos. Calm Over Pressure.</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md text-lg leading-relaxed">
                StudyHike is your companion through JEE's struggle — helping you stay calm, stay focused, and move with purpose.
              </p>
              <div className="text-base text-gray-500 space-y-2">
                <p>🪪 Founded by: Pratik Kumar</p>
                <p>📍 Based in: Kurnool, Andhra Pradesh, India</p>
                <p>📅 Launched: 2024</p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-6 text-xl">Quick Links</h4>
              <ul className="space-y-3 text-gray-400 text-lg">
                <li><a href="#journey" className="hover:text-yellow-400 transition-colors">The Journey</a></li>
                <li><a href="#plans" className="hover:text-yellow-400 transition-colors">Plans</a></li>
                <li><a href="#stories" className="hover:text-yellow-400 transition-colors">Success Stories</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">About</a></li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-white font-bold mb-6 text-xl">Contact</h4>
              <ul className="space-y-3 text-gray-400 text-base">
                <li>📨 info247studyhike@email.com</li>
                <li>🌐 YouTube: Coming Soon</li>
                <li>📱 Telegram: Available</li>
                <li>🏢 Status: Personal Project</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-500 text-lg">
              © 2024 StudyHike. Founded with ❤️ by Pratik Kumar. All rights reserved.
            </p>
            <p className="text-gray-600 text-base mt-3">
              Helping JEE/NEET aspirants transform their academic journey since 2024
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}