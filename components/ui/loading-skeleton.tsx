"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface LoadingSkeletonProps {
  className?: string
  width?: string
  height?: string
  rounded?: string
  delay?: number
}

export function LoadingSkeleton({
  className = "",
  width = "100%",
  height = "1rem",
  rounded = "md",
  delay = 0
}: LoadingSkeletonProps) {
  const [isVisible, setIsVisible] = useState(delay === 0)
  
  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, delay)
      
      return () => clearTimeout(timer)
    }
  }, [delay])
  
  return (
    <motion.div
      className={`bg-gray-200 dark:bg-gray-700 animate-pulse rounded-${rounded} ${className}`}
      style={{ width, height, opacity: isVisible ? 1 : 0 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
    />
  )
}

export function SequentialLoadingSkeleton({
  count = 3,
  baseDelay = 150,
  className = "",
  width = "100%",
  height = "1rem",
  rounded = "md",
  gap = "0.5rem"
}: {
  count?: number
  baseDelay?: number
  className?: string
  width?: string
  height?: string
  rounded?: string
  gap?: string
}) {
  return (
    <div className="space-y-2" style={{ gap }}>
      {Array.from({ length: count }).map((_, index) => (
        <LoadingSkeleton
          key={index}
          className={className}
          width={width}
          height={height}
          rounded={rounded}
          delay={baseDelay * index}
        />
      ))}
    </div>
  )
}

export function CardLoadingSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <LoadingSkeleton width="40%" height="1.5rem" />
      <LoadingSkeleton width="60%" height="1rem" delay={100} />
      
      <div className="pt-4">
        <SequentialLoadingSkeleton
          count={3}
          height="3rem"
          baseDelay={150}
        />
      </div>
    </div>
  )
}

export function TableLoadingSkeleton({
  rows = 5,
  columns = 4
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="space-y-4">
      <div className="flex space-x-4 pb-2">
        {Array.from({ length: columns }).map((_, index) => (
          <LoadingSkeleton
            key={`header-${index}`}
            width={`${100 / columns}%`}
            height="1.5rem"
            delay={50 * index}
          />
        ))}
      </div>
      
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <LoadingSkeleton
              key={`cell-${rowIndex}-${colIndex}`}
              width={`${100 / columns}%`}
              height="1rem"
              delay={100 + (50 * rowIndex) + (20 * colIndex)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}