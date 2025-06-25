"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LoadingSpinner } from "./loading-spinner"

interface DashboardLoaderProps {
  children: React.ReactNode
  portalType: "student" | "mentor" | "admin"
  userName?: string
}

export function DashboardLoader({
  children,
  portalType,
  userName = ""
}: DashboardLoaderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [loadingPhase, setLoadingPhase] = useState<
    "initializing" | "loading-data" | "preparing-dashboard" | "complete"
  >("initializing")
  const [fastLoading, setFastLoading] = useState(false)
  
  // Configure portal-specific settings
  const portalConfig = {
    student: {
      color: "blue" as const,
      animation: "pulse-dots" as const, // Simplified animation for better performance
      baseText: "Student Dashboard",
      phases: [
        "Initializing student environment",
        "Loading academic data",
        "Preparing personalized dashboard"
      ]
    },
    mentor: {
      color: "green" as const,
      animation: "pulse-dots" as const, // Simplified animation for better performance
      baseText: "Mentor Dashboard",
      phases: [
        "Initializing mentor environment",
        "Loading student data",
        "Preparing mentorship dashboard"
      ]
    },
    admin: {
      color: "purple" as const,
      animation: "pulse-dots" as const, // Simplified animation for better performance
      baseText: "Admin Dashboard",
      phases: [
        "Initializing admin environment",
        "Loading system data",
        "Preparing administration dashboard"
      ]
    }
  }
  
  const config = portalConfig[portalType]
  
  // Check for performance settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for performance mode settings
      const performanceMode = localStorage.getItem('performance_mode')
      const fastLoadingSetting = localStorage.getItem('fast_loading') === 'true'
      
      // Enable fast loading if performance mode is high or fast loading is enabled
      setFastLoading(performanceMode === 'high' || fastLoadingSetting)
    }
  }, [])
  
  // Simulate loading process with optimized timing
  useEffect(() => {
    // If fast loading is enabled, skip the loading animation
    if (fastLoading) {
      setIsLoading(false)
      setLoadingPhase("complete")
      return
    }
    
    // Phase 1: Initializing - faster initial phase
    setLoadingPhase("initializing")
    
    const phase1 = setTimeout(() => {
      setProgress(30)
      setLoadingPhase("loading-data")
      
      // Phase 2: Loading data - reduced time
      const phase2 = setTimeout(() => {
        setProgress(70)
        setLoadingPhase("preparing-dashboard")
        
        // Phase 3: Preparing dashboard - reduced time
        const phase3 = setTimeout(() => {
          setProgress(100)
          
          // Complete loading - reduced time
          const completePhase = setTimeout(() => {
            setIsLoading(false)
            setLoadingPhase("complete")
          }, 200) // Further reduced from 300ms
          
          return () => clearTimeout(completePhase)
        }, 300) // Further reduced from 500ms
        
        return () => clearTimeout(phase3)
      }, 400) // Further reduced from 600ms
      
      return () => clearTimeout(phase2)
    }, 300) // Further reduced from 500ms
    
    return () => clearTimeout(phase1)
  }, [fastLoading])
  
  // Get current loading text based on phase
  const getLoadingText = () => {
    switch (loadingPhase) {
      case "initializing":
        return config.phases[0]
      case "loading-data":
        return config.phases[1]
      case "preparing-dashboard":
        return config.phases[2]
      default:
        return "Loading"
    }
  }
  
  return (
    <div className="relative min-h-screen">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 bg-gradient-to-br from-[#0C0E19] via-[#111420] to-[#0C0E19] z-50 flex flex-col items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }} // Reduced from 0.5
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} // Smaller scale change for faster animation
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }} // Reduced from 0.5
              className="relative"
            >
              <LoadingSpinner
                animation={config.animation}
                color={config.color}
                size="lg"
                text={getLoadingText()}
                showProgress={true}
                progress={progress}
              />
              
              {/* Simplified particles - fewer particles for better performance */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 -z-10">
                {Array.from({ length: 6 }).map((_, i) => ( // Reduced from 12 to 6 particles
                  <motion.div
                    key={i}
                    className={`absolute w-2 h-2 rounded-full bg-${config.color}-400`}
                    initial={{ 
                      x: 0, 
                      y: 0,
                      opacity: 0 
                    }}
                    animate={{ 
                      x: Math.sin(i * 60 * (Math.PI / 180)) * 80, // Adjusted angle for fewer particles
                      y: Math.cos(i * 60 * (Math.PI / 180)) * 80,
                      opacity: [0, 0.8, 0], // Reduced opacity range
                      scale: [0.9, 1.1, 0.9] // Reduced scale range
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5, // Reduced from 2
                      delay: i * 0.15,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </motion.div>
            
            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0, y: 10 }} // Reduced y offset
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }} // Reduced delay and duration
            >
              <h2 className="text-2xl font-bold text-white">
                {userName ? `Welcome to StudyHike` : `Loading ${config.baseText}`}
              </h2>
              <p className="text-gray-400 mt-2">
                {userName ? `Hello, ${userName}! Setting up your workspace...` : `Preparing your personalized experience`}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className={isLoading ? "invisible" : "visible"}>
        {children}
      </div>
    </div>
  )
}