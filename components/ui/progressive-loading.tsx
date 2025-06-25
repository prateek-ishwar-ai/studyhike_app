"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"

interface ProgressiveLoadingProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
  isLoading?: boolean
  height?: number | string
  skeletonClassName?: string
}

export function ProgressiveLoading({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
  isLoading = false,
  height = 200,
  skeletonClassName = ""
}: ProgressiveLoadingProps) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)
    
    return () => clearTimeout(timer)
  }, [delay])
  
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`${className} ${skeletonClassName}`}
      >
        <Skeleton className={`w-full ${typeof height === 'number' ? `h-[${height}px]` : `h-${height}`}`} />
      </motion.div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ProgressiveLoadingContainer({ 
  children,
  baseDelay = 50,  // Reduced from 100
  staggerDelay = 50 // Reduced from 150
}: { 
  children: React.ReactNode,
  baseDelay?: number,
  staggerDelay?: number
}) {
  // Track which children have been loaded
  const [loadedIndices, setLoadedIndices] = useState<number[]>([])
  
  // Load all children much faster
  useEffect(() => {
    // Load first batch immediately
    const childCount = React.Children.count(children);
    const initialBatch = Array.from({ length: Math.min(3, childCount) }, (_, i) => i);
    setLoadedIndices(initialBatch);
    
    // Load remaining children with minimal delay
    if (childCount > 3) {
      const timer = setTimeout(() => {
        setLoadedIndices(Array.from({ length: childCount }, (_, i) => i));
      }, baseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [children, baseDelay]);
  
  return (
    <div className="space-y-6">
      {React.Children.map(children, (child, index) => {
        const isLoaded = loadedIndices.includes(index)
        const childDelay = isLoaded ? 0 : staggerDelay
        
        return (
          <ProgressiveLoading 
            key={index} 
            delay={childDelay}
            isLoading={!isLoaded}
          >
            {child}
          </ProgressiveLoading>
        )
      })}
    </div>
  )
}