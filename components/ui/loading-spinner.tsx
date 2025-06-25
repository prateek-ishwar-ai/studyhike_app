"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  animation?: "pulse-dots" | "progress-bar" | "energy-flow" | "fade-blocks" | "sci-fi"
  text?: string
  color?: "blue" | "yellow" | "green" | "purple" | "orange"
  showProgress?: boolean
  progress?: number
}

export function LoadingSpinner({ 
  size = "md", 
  animation = "pulse-dots",
  text,
  color = "blue",
  showProgress = false,
  progress = 0
}: LoadingSpinnerProps) {
  const [progressValue, setProgressValue] = useState(progress)
  const [loadingText, setLoadingText] = useState(text || "Loading")
  const [dots, setDots] = useState("")
  
  // Auto-increment progress if not provided externally
  useEffect(() => {
    if (!showProgress) return
    
    if (progress > 0) {
      setProgressValue(progress)
      return
    }
    
    const interval = setInterval(() => {
      setProgressValue(prev => {
        const newValue = prev + Math.random() * 5
        return newValue >= 100 ? 100 : newValue
      })
    }, 300)
    
    return () => clearInterval(interval)
  }, [progress, showProgress])
  
  // Animate loading text dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) return ""
        return prev + "."
      })
    }, 400)
    
    return () => clearInterval(interval)
  }, [])
  
  const colorClasses = {
    blue: {
      primary: "bg-blue-500",
      secondary: "bg-blue-400",
      text: "text-blue-400",
      border: "border-blue-500",
      glow: "shadow-blue-500/50",
      light: "bg-blue-200",
      dark: "bg-blue-800"
    },
    yellow: {
      primary: "bg-yellow-400",
      secondary: "bg-yellow-300",
      text: "text-yellow-400",
      border: "border-yellow-400",
      glow: "shadow-yellow-400/50",
      light: "bg-yellow-200",
      dark: "bg-yellow-600"
    },
    green: {
      primary: "bg-green-500",
      secondary: "bg-green-400",
      text: "text-green-400",
      border: "border-green-500",
      glow: "shadow-green-500/50",
      light: "bg-green-200",
      dark: "bg-green-700"
    },
    purple: {
      primary: "bg-purple-500",
      secondary: "bg-purple-400",
      text: "text-purple-400",
      border: "border-purple-500",
      glow: "shadow-purple-500/50",
      light: "bg-purple-200",
      dark: "bg-purple-700"
    },
    orange: {
      primary: "bg-orange-400",
      secondary: "bg-orange-300",
      text: "text-orange-400",
      border: "border-orange-400",
      glow: "shadow-orange-400/50",
      light: "bg-orange-200",
      dark: "bg-orange-600"
    }
  }
  
  const sizeClasses = {
    sm: {
      container: "h-4 w-4",
      text: "text-xs",
      progressBar: "h-1 w-16",
      dot: "h-1.5 w-1.5",
      block: "h-2 w-2",
      gap: "gap-1"
    },
    md: {
      container: "h-8 w-8",
      text: "text-sm",
      progressBar: "h-2 w-32",
      dot: "h-2.5 w-2.5",
      block: "h-3 w-3",
      gap: "gap-2"
    },
    lg: {
      container: "h-12 w-12",
      text: "text-base",
      progressBar: "h-3 w-48",
      dot: "h-3.5 w-3.5",
      block: "h-4 w-4",
      gap: "gap-3"
    }
  }
  
  const renderSpinner = () => {
    switch (animation) {
      case "pulse-dots":
        return (
          <div className={`flex ${sizeClasses[size].gap}`}>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`${sizeClasses[size].dot} ${colorClasses[color].primary} rounded-full`}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )
        
      case "progress-bar":
        return (
          <div className={`${sizeClasses[size].progressBar} bg-gray-200 rounded-full overflow-hidden`}>
            <motion.div
              className={`h-full ${colorClasses[color].primary} rounded-full`}
              initial={{ width: "0%" }}
              animate={{ width: showProgress ? `${progressValue}%` : "100%" }}
              transition={showProgress ? { duration: 0.3 } : {
                duration: 1.5,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
          </div>
        )
        
      case "energy-flow":
        return (
          <div className={`relative ${sizeClasses[size].container} rounded-full border-2 border-gray-300`}>
            <motion.div
              className={`absolute inset-0 rounded-full ${colorClasses[color].primary}`}
              animate={{
                boxShadow: [
                  `0 0 0 0 ${color === 'blue' ? '#3b82f6' : color === 'yellow' ? '#eab308' : color === 'green' ? '#16a34a' : color === 'purple' ? '#9333ea' : '#f97316'}`,
                  `0 0 10px 3px ${color === 'blue' ? '#3b82f6' : color === 'yellow' ? '#eab308' : color === 'green' ? '#16a34a' : color === 'purple' ? '#9333ea' : '#f97316'}`,
                  `0 0 0 0 ${color === 'blue' ? '#3b82f6' : color === 'yellow' ? '#eab308' : color === 'green' ? '#16a34a' : color === 'purple' ? '#9333ea' : '#f97316'}`
                ],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-white"
              animate={{
                opacity: [0, 0.5, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        )
        
      case "fade-blocks":
        return (
          <div className="flex space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={`${sizeClasses[size].block} ${colorClasses[color].primary} rounded-sm`}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  y: [0, -4, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
        )
        
      case "sci-fi":
        return (
          <div className="relative">
            <motion.div
              className={`${sizeClasses[size].container} border-2 ${colorClasses[color].border} rounded-full relative overflow-hidden`}
              animate={{
                boxShadow: [
                  `0 0 0 0 ${color === 'blue' ? 'rgba(59, 130, 246, 0.5)' : color === 'yellow' ? 'rgba(234, 179, 8, 0.5)' : color === 'green' ? 'rgba(22, 163, 74, 0.5)' : color === 'purple' ? 'rgba(147, 51, 234, 0.5)' : 'rgba(249, 115, 22, 0.5)'}`,
                  `0 0 15px 5px ${color === 'blue' ? 'rgba(59, 130, 246, 0.5)' : color === 'yellow' ? 'rgba(234, 179, 8, 0.5)' : color === 'green' ? 'rgba(22, 163, 74, 0.5)' : color === 'purple' ? 'rgba(147, 51, 234, 0.5)' : 'rgba(249, 115, 22, 0.5)'}`,
                  `0 0 0 0 ${color === 'blue' ? 'rgba(59, 130, 246, 0.5)' : color === 'yellow' ? 'rgba(234, 179, 8, 0.5)' : color === 'green' ? 'rgba(22, 163, 74, 0.5)' : color === 'purple' ? 'rgba(147, 51, 234, 0.5)' : 'rgba(249, 115, 22, 0.5)'}`
                ],
                rotate: [0, 360]
              }}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                rotate: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }
              }}
            >
              <motion.div
                className={`absolute top-0 left-0 w-full h-full ${colorClasses[color].primary} opacity-50`}
                animate={{
                  background: [
                    `linear-gradient(90deg, ${color === 'blue' ? '#3b82f6' : color === 'yellow' ? '#eab308' : color === 'green' ? '#16a34a' : color === 'purple' ? '#9333ea' : '#f97316'} 0%, transparent 50%, transparent 100%)`,
                    `linear-gradient(180deg, ${color === 'blue' ? '#3b82f6' : color === 'yellow' ? '#eab308' : color === 'green' ? '#16a34a' : color === 'purple' ? '#9333ea' : '#f97316'} 0%, transparent 50%, transparent 100%)`,
                    `linear-gradient(270deg, ${color === 'blue' ? '#3b82f6' : color === 'yellow' ? '#eab308' : color === 'green' ? '#16a34a' : color === 'purple' ? '#9333ea' : '#f97316'} 0%, transparent 50%, transparent 100%)`,
                    `linear-gradient(360deg, ${color === 'blue' ? '#3b82f6' : color === 'yellow' ? '#eab308' : color === 'green' ? '#16a34a' : color === 'purple' ? '#9333ea' : '#f97316'} 0%, transparent 50%, transparent 100%)`,
                    `linear-gradient(90deg, ${color === 'blue' ? '#3b82f6' : color === 'yellow' ? '#eab308' : color === 'green' ? '#16a34a' : color === 'purple' ? '#9333ea' : '#f97316'} 0%, transparent 50%, transparent 100%)`
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </motion.div>
            
            {/* Small orbiting dot */}
            <motion.div
              className={`absolute ${colorClasses[color].secondary} rounded-full ${size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-2 w-2' : 'h-3 w-3'}`}
              style={{ 
                top: '50%', 
                left: '50%',
                marginTop: size === 'sm' ? '-2px' : size === 'md' ? '-4px' : '-6px',
                marginLeft: size === 'sm' ? '-2px' : size === 'md' ? '-4px' : '-6px'
              }}
              animate={{
                x: [
                  size === 'sm' ? 8 : size === 'md' ? 16 : 24,
                  0,
                  -1 * (size === 'sm' ? 8 : size === 'md' ? 16 : 24),
                  0,
                  size === 'sm' ? 8 : size === 'md' ? 16 : 24
                ],
                y: [
                  0,
                  size === 'sm' ? 8 : size === 'md' ? 16 : 24,
                  0,
                  -1 * (size === 'sm' ? 8 : size === 'md' ? 16 : 24),
                  0
                ],
                scale: [1, 1.2, 1, 1.2, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>
        )
        
      default:
        return (
          <div className={`${sizeClasses[size].container} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}></div>
        )
    }
  }
  
  return (
    <div className="flex flex-col items-center justify-center">
      {renderSpinner()}
      {(text || showProgress) && (
        <div className={`flex flex-col items-center mt-3 ${sizeClasses[size].text}`}>
          {text && (
            <p className={`${colorClasses[color].text} font-medium`}>
              {loadingText}{dots}
            </p>
          )}
          {showProgress && (
            <p className="text-gray-600 mt-1">
              {Math.round(progressValue)}%
            </p>
          )}
        </div>
      )}
    </div>
  )
}