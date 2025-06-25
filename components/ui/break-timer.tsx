"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, RotateCcw, Coffee } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface BreakTimerProps {
  duration?: number // in minutes
  onComplete?: () => void
}

export function BreakTimer({ duration = 20, onComplete }: BreakTimerProps) {
  // State for timer
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(duration * 60) // convert to seconds
  
  // References
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Initialize audio on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/break-end.mp3')
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])
  
  // Timer effect
  useEffect(() => {
    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up
            handleComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isActive, isPaused])
  
  // Handle timer start
  const handleStart = () => {
    setIsActive(true)
    setIsPaused(false)
    
    toast({
      title: "Break time started",
      description: `Take a ${duration}-minute break to recharge.`,
    })
  }
  
  // Handle timer pause
  const handlePause = () => {
    setIsPaused(true)
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }
  
  // Handle timer resume
  const handleResume = () => {
    setIsPaused(false)
  }
  
  // Handle timer reset
  const handleReset = () => {
    setIsActive(false)
    setIsPaused(false)
    setTimeRemaining(duration * 60)
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }
  
  // Handle timer complete
  const handleComplete = () => {
    setIsActive(false)
    setIsPaused(false)
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    // Play completion sound
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(e => console.error("Error playing sound:", e))
      }
    } catch (error) {
      console.error("Error playing sound:", error)
    }
    
    // Show completion toast
    toast({
      title: "Break time over!",
      description: "Time to get back to studying.",
    })
    
    // Call onComplete callback if provided
    if (onComplete) {
      onComplete()
    }
  }
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Calculate progress percentage
  const getProgress = () => {
    const total = duration * 60
    return ((total - timeRemaining) / total) * 100
  }
  
  return (
    <Card className={`${isActive ? "border-2 border-teal-500" : ""}`}>
      <CardHeader className="bg-teal-100 text-teal-800 border-teal-200 rounded-t-lg">
        <CardTitle className="flex items-center justify-between">
          <span>Break Timer</span>
          {isActive && <span className="animate-pulse">☕</span>}
        </CardTitle>
        <CardDescription>
          {duration}-minute break between subjects
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          {/* Break timer */}
          <div>
            <div className="text-3xl font-bold mb-2">{formatTime(timeRemaining)}</div>
            <Progress value={getProgress()} className="h-2 mb-4" />
          </div>
          
          {/* Timer controls */}
          <div className="flex justify-center space-x-2 mt-4">
            {!isActive ? (
              <Button onClick={handleStart} className="bg-teal-600 hover:bg-teal-700">
                <Play className="h-4 w-4 mr-2" />
                Start Break
              </Button>
            ) : isPaused ? (
              <Button onClick={handleResume} className="bg-teal-600 hover:bg-teal-700">
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            ) : (
              <Button onClick={handlePause} className="bg-teal-600 hover:bg-teal-700">
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            )}
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}