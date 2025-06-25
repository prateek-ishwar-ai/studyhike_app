"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LoadingSpinner } from "./loading-spinner"

interface ChunkedLoaderProps {
  children: React.ReactNode
  chunkSize?: number
  initialDelay?: number
  chunkDelay?: number
  loadingAnimation?: "pulse-dots" | "progress-bar" | "energy-flow" | "fade-blocks" | "sci-fi"
  color?: "blue" | "yellow" | "green" | "purple" | "orange"
  showLoadingOverlay?: boolean
  loadingText?: string
  priority?: React.ReactNode[] // Components that should load first
}

export function ChunkedLoader({
  children,
  chunkSize = 3,
  initialDelay = 100,
  chunkDelay = 150,
  loadingAnimation = "pulse-dots",
  color = "blue",
  showLoadingOverlay = true,
  loadingText = "Loading content",
  priority = []
}: ChunkedLoaderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [visibleChunks, setVisibleChunks] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Convert children to array and create chunks
  const childrenArray = React.Children.toArray(children)
  
  // Separate priority items from regular content
  const regularContent = childrenArray.filter(child => !priority.includes(child))
  
  // Calculate number of chunks
  const chunks = []
  
  // First add priority items as their own chunk
  if (priority.length > 0) {
    chunks.push(priority)
  }
  
  // Then chunk the regular content
  for (let i = 0; i < regularContent.length; i += chunkSize) {
    chunks.push(regularContent.slice(i, i + chunkSize))
  }
  
  const totalChunks = chunks.length
  
  useEffect(() => {
    // Start loading after initial delay
    const initialTimer = setTimeout(() => {
      setIsLoading(true)
      setProgress(5)
      setVisibleChunks(1) // Show first chunk immediately (priority items)
      
      // Load remaining chunks progressively
      let currentChunk = 1
      
      const chunkTimer = setInterval(() => {
        if (currentChunk >= totalChunks) {
          clearInterval(chunkTimer)
          setProgress(100)
          
          // Hide loading overlay after all chunks are loaded
          setTimeout(() => {
            setIsLoading(false)
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
  }, [chunkDelay, initialDelay, totalChunks])
  
  return (
    <div className="relative" ref={contentRef}>
      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && showLoadingOverlay && (
          <motion.div
            className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingSpinner
              animation={loadingAnimation}
              color={color}
              size="lg"
              text={loadingText}
              showProgress={true}
              progress={progress}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Content chunks */}
      <div className="space-y-4">
        {chunks.map((chunk, chunkIndex) => (
          <AnimatePresence key={`chunk-${chunkIndex}`}>
            {chunkIndex < visibleChunks && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4,
                  staggerChildren: 0.1,
                  delayChildren: 0.1
                }}
              >
                {chunk.map((child, childIndex) => (
                  <motion.div 
                    key={`child-${chunkIndex}-${childIndex}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: childIndex * 0.05 }}
                  >
                    {child}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>
    </div>
  )
}