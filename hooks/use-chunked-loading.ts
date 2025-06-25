"use client"

import { useState, useEffect, useCallback } from "react"

interface UseChunkedLoadingOptions {
  totalChunks?: number
  initialDelay?: number
  chunkDelay?: number
  onComplete?: () => void
}

export function useChunkedLoading({
  totalChunks = 5,
  initialDelay = 100,
  chunkDelay = 150,
  onComplete
}: UseChunkedLoadingOptions = {}) {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [visibleChunks, setVisibleChunks] = useState(0)
  
  // Function to start loading process
  const startLoading = useCallback(() => {
    setIsLoading(true)
    setProgress(0)
    setVisibleChunks(0)
    
    // Start loading after initial delay
    const initialTimer = setTimeout(() => {
      setProgress(5)
      setVisibleChunks(1) // Show first chunk immediately
      
      // Load remaining chunks progressively
      let currentChunk = 1
      
      const chunkTimer = setInterval(() => {
        if (currentChunk >= totalChunks) {
          clearInterval(chunkTimer)
          setProgress(100)
          
          // Hide loading overlay after all chunks are loaded
          setTimeout(() => {
            setIsLoading(false)
            if (onComplete) onComplete()
          }, 300)
          return
        }
        
        setVisibleChunks(currentChunk + 1)
        setProgress(Math.min(95, ((currentChunk + 1) / totalChunks) * 100))
        currentChunk++
      }, chunkDelay)
      
      return () => {
        clearInterval(chunkTimer)
      }
    }, initialDelay)
    
    return () => clearTimeout(initialTimer)
  }, [chunkDelay, initialDelay, onComplete, totalChunks])
  
  // Start loading on mount
  useEffect(() => {
    const cleanup = startLoading()
    return cleanup
  }, [startLoading])
  
  // Function to manually reset and restart loading
  const resetLoading = () => {
    setIsLoading(true)
    setProgress(0)
    setVisibleChunks(0)
    startLoading()
  }
  
  return {
    isLoading,
    progress,
    visibleChunks,
    totalChunks,
    resetLoading,
    startLoading
  }
}