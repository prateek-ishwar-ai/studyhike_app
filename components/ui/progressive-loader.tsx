"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LoadingSpinner } from "./loading-spinner"

interface ProgressiveLoaderProps {
  children: React.ReactNode
  loading?: boolean
  sections?: number
  color?: "blue" | "yellow" | "green" | "purple" | "orange"
  animation?: "pulse-dots" | "progress-bar" | "energy-flow" | "fade-blocks" | "sci-fi"
  loadingText?: string
  showProgress?: boolean
  className?: string
}

export function ProgressiveLoader({
  children,
  loading = false,
  sections = 2,
  color = "blue",
  animation = "pulse-dots",
  loadingText = "Loading",
  showProgress = true,
  className = ""
}: ProgressiveLoaderProps) {
  const [loadingState, setLoadingState] = useState<"initial" | "loading" | "complete">(
    loading ? "initial" : "complete"
  )
  const [progress, setProgress] = useState(0)
  const [visibleSections, setVisibleSections] = useState(0)
  
  // Convert children to array for progressive loading
  const childrenArray = React.Children.toArray(children)
  const sectionSize = Math.ceil(childrenArray.length / sections)
  
  // Create sections of content
  const contentSections = Array.from({ length: sections }, (_, i) => {
    const start = i * sectionSize
    const end = Math.min(start + sectionSize, childrenArray.length)
    return childrenArray.slice(start, end)
  })
  
  useEffect(() => {
    if (!loading) {
      setLoadingState("complete")
      setVisibleSections(sections)
      return
    }
    
    setLoadingState("loading")
    setProgress(0)
    setVisibleSections(0)
    
    // Simulate progressive loading
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * 15 + 5 // Random increment between 5-20
        return Math.min(prev + increment, 100)
      })
    }, 300)
    
    // Load sections progressively
    const sectionInterval = setInterval(() => {
      setVisibleSections(prev => {
        if (prev >= sections) {
          clearInterval(sectionInterval)
          return prev
        }
        return prev + 1
      })
    }, 800) // Load a new section every 800ms
    
    // Complete loading
    const timeout = setTimeout(() => {
      setLoadingState("complete")
      setVisibleSections(sections)
      clearInterval(progressInterval)
      clearInterval(sectionInterval)
    }, sections * 800 + 500) // Total loading time based on sections
    
    return () => {
      clearInterval(progressInterval)
      clearInterval(sectionInterval)
      clearTimeout(timeout)
    }
  }, [loading, sections])
  
  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {loadingState !== "complete" && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LoadingSpinner
              animation={animation}
              color={color}
              size="lg"
              text={loadingText}
              showProgress={showProgress}
              progress={progress}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="space-y-4">
        {contentSections.map((section, index) => (
          <AnimatePresence key={index}>
            {index < visibleSections && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {section}
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>
    </div>
  )
}