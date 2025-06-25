"use client"

import { useState, useEffect } from "react"

interface UseProgressiveLoadingOptions {
  initialLoading?: boolean
  loadingDuration?: number
  sections?: number
  sectionDelay?: number
}

export function useProgressiveLoading({
  initialLoading = true,
  loadingDuration = 2000,
  sections = 2,
  sectionDelay = 800
}: UseProgressiveLoadingOptions = {}) {
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [progress, setProgress] = useState(0)
  const [visibleSections, setVisibleSections] = useState(0)
  
  useEffect(() => {
    if (!initialLoading) {
      setIsLoading(false)
      setProgress(100)
      setVisibleSections(sections)
      return
    }
    
    // Reset states
    setIsLoading(true)
    setProgress(0)
    setVisibleSections(0)
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // Ensure progress doesn't reach 100% until all sections are loaded
        const maxProgress = Math.min(95, (visibleSections / sections) * 100)
        const increment = Math.random() * 10 + 2 // Random increment between 2-12
        const newProgress = Math.min(prev + increment, maxProgress)
        return newProgress
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
    }, sectionDelay)
    
    // Complete loading
    const timeout = setTimeout(() => {
      setIsLoading(false)
      setProgress(100)
      setVisibleSections(sections)
      clearInterval(progressInterval)
      clearInterval(sectionInterval)
    }, loadingDuration)
    
    return () => {
      clearInterval(progressInterval)
      clearInterval(sectionInterval)
      clearTimeout(timeout)
    }
  }, [initialLoading, loadingDuration, sections, sectionDelay])
  
  // Function to manually trigger loading
  const startLoading = () => {
    setIsLoading(true)
    setProgress(0)
    setVisibleSections(0)
    
    // Same logic as above but in a separate function
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const maxProgress = Math.min(95, (visibleSections / sections) * 100)
        const increment = Math.random() * 10 + 2
        const newProgress = Math.min(prev + increment, maxProgress)
        return newProgress
      })
    }, 300)
    
    const sectionInterval = setInterval(() => {
      setVisibleSections(prev => {
        if (prev >= sections) {
          clearInterval(sectionInterval)
          return prev
        }
        return prev + 1
      })
    }, sectionDelay)
    
    setTimeout(() => {
      setIsLoading(false)
      setProgress(100)
      setVisibleSections(sections)
      clearInterval(progressInterval)
      clearInterval(sectionInterval)
    }, loadingDuration)
  }
  
  return {
    isLoading,
    progress,
    visibleSections,
    startLoading,
    totalSections: sections
  }
}