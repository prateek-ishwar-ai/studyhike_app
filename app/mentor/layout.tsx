"use client"

import React, { useState, useEffect } from "react"
import { MentorSidebar } from "@/components/layout/mentor-sidebar"
import { MentorHeader } from "@/components/layout/mentor-header"
import { MeetingRequestsCheck } from "../meeting-requests-check"
import { DashboardLoader } from "@/components/ui/dashboard-loader"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = useAuth()
  const userName = profile?.full_name || "Mentor"
  const [reducedAnimations, setReducedAnimations] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Check for performance settings
  useEffect(() => {
    setMounted(true)
    
    if (typeof window !== 'undefined') {
      // Check if user prefers reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      
      // Check for performance mode settings
      const performanceMode = localStorage.getItem('performance_mode')
      const reducedAnimationsSetting = localStorage.getItem('reduced_animations') === 'true'
      
      // Disable animations if any of these conditions are true
      setReducedAnimations(prefersReducedMotion || performanceMode === 'high' || reducedAnimationsSetting)
    }
  }, [])
  
  // Show a simple loading state while checking performance settings
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0C0E19]">
        <div className="animate-pulse text-white text-lg">Loading...</div>
      </div>
    )
  }
  
  return (
    <DashboardLoader portalType="mentor" userName={userName}>
      <div className="flex h-screen bg-[#0C0E19]">
        {/* Sidebar loads independently - with or without animations based on settings */}
        {reducedAnimations ? (
          <MentorSidebar />
        ) : (
          <AnimatePresence>
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }} /* Reduced from 0.5 */
            >
              <MentorSidebar />
            </motion.div>
          </AnimatePresence>
        )}
        
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <MentorHeader mentorName={userName} />
          
          {/* Meeting requests check */}
          <div className="px-6 pt-6">
            <MeetingRequestsCheck />
          </div>
          
          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6 bg-[#0C0E19] text-white">
            {children}
          </main>
        </div>
      </div>
    </DashboardLoader>
  )
}
