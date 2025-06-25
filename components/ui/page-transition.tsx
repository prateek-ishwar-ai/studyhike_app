"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { LoadingSpinner } from "./loading-spinner"

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [displayChildren, setDisplayChildren] = useState(children)
  
  // Determine which portal we're in to customize the loading animation
  const getPortalInfo = () => {
    if (pathname.startsWith("/admin")) {
      return {
        color: "purple",
        animation: "fade-blocks",
        text: "Loading Admin Page"
      }
    } else if (pathname.startsWith("/mentor")) {
      return {
        color: "green",
        animation: "energy-flow",
        text: "Loading Mentor Page"
      }
    } else if (pathname.startsWith("/student")) {
      return {
        color: "blue",
        animation: "sci-fi",
        text: "Loading Student Page"
      }
    } else {
      return {
        color: "yellow",
        animation: "pulse-dots",
        text: "Loading"
      }
    }
  }
  
  const { color, animation, text } = getPortalInfo()
  
  useEffect(() => {
    // When pathname changes, show loading state but with a much shorter delay
    setIsLoading(true)
    
    // Update the children to the new page content immediately
    setDisplayChildren(children)
    
    // Hide the loading state after a minimal delay
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    
    return () => clearTimeout(timeout)
  }, [pathname, children])
  
  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingSpinner
              animation={animation as any}
              color={color as any}
              size="lg"
              text={text}
              showProgress={true}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {displayChildren}
      </motion.div>
    </>
  )
}