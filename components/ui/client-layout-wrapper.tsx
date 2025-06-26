"use client"

import React, { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { PageTransition } from "./page-transition"

interface ClientLayoutWrapperProps {
  children: React.ReactNode
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const pathname = usePathname()
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true)
  
  // Check for performance settings and disable transitions if needed
  useEffect(() => {
    // Mark first load as complete
    if (isFirstLoad) {
      setIsFirstLoad(false)
    }
    
    // Check for performance settings
    if (typeof window !== 'undefined') {
      try {
        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        
        // Check for performance mode settings
        const performanceMode = localStorage.getItem('performance_mode')
        const reducedAnimations = localStorage.getItem('reduced_animations') === 'true'
        
        // Disable transitions if any of these conditions are true
        if (prefersReducedMotion || performanceMode === 'high' || reducedAnimations) {
          setIsTransitionEnabled(false)
        }
      } catch (error) {
        console.warn("Failed to access browser APIs:", error)
        // Fallback: disable transitions for safety
        setIsTransitionEnabled(false)
      }
    }
  }, [isFirstLoad, pathname])
  
  // Skip transitions for better performance if disabled or on first load
  if (isFirstLoad || !isTransitionEnabled) {
    return <>{children}</>
  }
  
  return <PageTransition>{children}</PageTransition>
}