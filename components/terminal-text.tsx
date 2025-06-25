"use client"

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { BookOpen, GraduationCap, Brain } from 'lucide-react'

interface StudentTextProps {
  text: string
  typingSpeed?: number
  startDelay?: number
  className?: string
  onComplete?: () => void
  variant?: 'forest' | 'river' | 'mountain'
  prefix?: string
}

export default function TerminalText({
  text,
  typingSpeed = 50,
  startDelay = 0,
  className,
  onComplete,
  variant = 'forest',
  prefix = 'insight'
}: StudentTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  
  useEffect(() => {
    let timeout: NodeJS.Timeout
    
    // Reset and start typing with delay
    setDisplayedText('')
    
    timeout = setTimeout(() => {
      setIsTyping(true)
      
      let currentIndex = 0
      const intervalId = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(prev => prev + text[currentIndex])
          currentIndex++
        } else {
          clearInterval(intervalId)
          setIsTyping(false)
          if (onComplete) onComplete()
        }
      }, typingSpeed)
      
      return () => clearInterval(intervalId)
    }, startDelay)
    
    return () => clearTimeout(timeout)
  }, [text, typingSpeed, startDelay, onComplete])

  const getVariantStyles = () => {
    switch (variant) {
      case 'river':
        return {
          borderColor: 'border-indigo-300',
          bgColor: 'bg-indigo-50',
          textColor: 'text-indigo-700',
          cursorColor: 'bg-indigo-400'
        }
      case 'mountain':
        return {
          borderColor: 'border-purple-300',
          bgColor: 'bg-purple-50',
          textColor: 'text-purple-700',
          cursorColor: 'bg-purple-400'
        }
      default: // forest
        return {
          borderColor: 'border-blue-300',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          cursorColor: 'bg-blue-400'
        }
    }
  }
  
  const styles = getVariantStyles()

  return (
    <div className={cn(
      'student-text border-l-2 pl-3 py-2 rounded-r-lg shadow-sm',
      styles.borderColor,
      styles.bgColor,
      className
    )}>
      <div className="flex items-center text-xs mb-2">
        {variant === 'mountain' ? (
          <Brain className={`h-3 w-3 mr-1 ${styles.textColor}`} />
        ) : variant === 'river' ? (
          <GraduationCap className={`h-3 w-3 mr-1 ${styles.textColor}`} />
        ) : (
          <BookOpen className={`h-3 w-3 mr-1 ${styles.textColor}`} />
        )}
        <span className={`mr-1 ${styles.textColor} font-medium`}>{prefix}</span>
        <span className={`animate-gentle-pulse h-1 w-1 rounded-full ${styles.cursorColor} ml-1`}></span>
      </div>
      
      <div className="relative">
        <span className={`${styles.textColor} ${isTyping ? 'opacity-90' : 'opacity-100'}`}>
          {displayedText}
        </span>
        {isTyping && (
          <span className={`absolute inline-block h-4 w-0.5 ${styles.cursorColor} ml-0.5 animate-gentle-pulse`}></span>
        )}
      </div>
    </div>
  )
}