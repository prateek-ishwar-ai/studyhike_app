"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Play, Pause, RotateCcw, Clock, CheckCircle, AlertCircle, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SubjectTimerProps {
  subject: "Mathematics" | "Physics" | "Chemistry" | "Revision"
  onComplete?: () => void
  onQuestionComplete?: (completed: boolean) => void
  totalQuestions?: number
  totalDuration?: number // in minutes
}

export function SubjectTimer({ 
  subject, 
  onComplete, 
  onQuestionComplete,
  totalQuestions = 10,
  totalDuration 
}: SubjectTimerProps) {
  // Define question durations based on subject
  const getQuestionDuration = () => {
    switch (subject) {
      case "Mathematics":
        return 8 * 60; // 8 minutes in seconds
      case "Physics":
        return 5 * 60; // 5 minutes in seconds
      case "Chemistry":
        return 3 * 60; // 3 minutes in seconds
      case "Revision":
        return 60 * 60; // 60 minutes in seconds
      default:
        return 5 * 60; // Default 5 minutes
    }
  }

  // State for timer
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(getQuestionDuration())
  const [completedQuestions, setCompletedQuestions] = useState(0)
  const [totalTimeRemaining, setTotalTimeRemaining] = useState(
    totalDuration ? totalDuration * 60 : 
    (subject === "Revision" ? 60 * 60 : // 1 hour for revision
     getQuestionDuration() * Math.max(1, totalQuestions)) // Ensure we don't multiply by 0
  )
  const [showCompletionDialog, setShowCompletionDialog] = useState(false)
  const [countdown, setCountdown] = useState(0) // Countdown before starting timer
  const [showCountdown, setShowCountdown] = useState(false)
  const [motivationalMessages] = useState([
    "Great job! Keep going! 🚀",
    "You're making excellent progress! 💪",
    "Awesome work! You're getting closer to your goal! ✨",
    "Fantastic! Your hard work is paying off! 🌟",
    "Excellent! You're on a roll! 🔥",
    "Amazing progress! Keep up the good work! 👏",
    "Well done! You're crushing it! 💯",
    "Brilliant work! You're doing great! 🎯",
    "Superb! You're making steady progress! 🏆",
    "Impressive! Keep up the momentum! 🌈"
  ])
  
  // References
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentQuestionRef = useRef<number>(0)
  
  // Initialize audio on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/beep.mp3')
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
            // Time's up for this question
            playBeep(2) // Play beep twice to make it more noticeable
            
            // Show completion dialog
            if (subject !== "Revision") {
              setShowCompletionDialog(true)
              
              // Pause the timer while dialog is shown
              setIsPaused(true)
              
              // Show toast notification
              toast({
                title: `Time's up for ${subject} question!`,
                description: `Have you completed question #${currentQuestionRef.current + 1}?`,
                variant: "default",
              })
              
              return 0;
            } else {
              // For revision, just complete the session
              handleComplete();
              return 0;
            }
          }
          return prev - 1
        })
        
        setTotalTimeRemaining(prev => {
          if (prev <= 1) {
            // Total time is up
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
  
  // Play beep sound
  const playBeep = (times = 1) => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        
        const playBeepSequence = (count: number) => {
          if (count <= 0) return
          
          audioRef.current?.play()
            .then(() => {
              if (count > 1) {
                setTimeout(() => playBeepSequence(count - 1), 500)
              }
            })
            .catch(e => console.error("Error playing sound:", e))
        }
        
        playBeepSequence(times)
      }
    } catch (error) {
      console.error("Error playing beep:", error)
    }
  }
  
  // Handle question completion
  const handleQuestionCompletion = (completed: boolean) => {
    // Close the dialog
    setShowCompletionDialog(false)
    
    // Resume the timer
    setIsPaused(false)
    
    // Get current question number before incrementing
    const currentQuestionNumber = currentQuestionRef.current + 1
    
    // Increment current question
    currentQuestionRef.current += 1
    
    // Reset the timer for the next question
    setTimeRemaining(getQuestionDuration())
    
    if (completed) {
      // Increment completed questions count
      setCompletedQuestions(prev => prev + 1)
      
      // Show motivational message
      const randomIndex = Math.floor(Math.random() * motivationalMessages.length)
      toast({
        title: `Question #${currentQuestionNumber} completed!`,
        description: `${motivationalMessages[randomIndex]} ${completedQuestions + 1}/${totalQuestions} questions done in ${subject}.`,
      })
    } else {
      // Show overtime message
      toast({
        title: `Moving to next question`,
        description: `You're now working on question #${currentQuestionRef.current + 1} in ${subject}.`,
        variant: "default",
      })
    }
    
    // Notify parent component
    if (onQuestionComplete) {
      onQuestionComplete(completed)
    }
    
    // Check if all questions are completed
    if (completedQuestions + (completed ? 1 : 0) >= totalQuestions && subject !== "Revision") {
      // Play completion sound (3 beeps)
      playBeep(3)
      
      // Show completion toast
      toast({
        title: `${subject} session complete!`,
        description: `Congratulations! You've completed all ${totalQuestions} questions. Take a 20-minute break.`,
      })
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete()
      }
      
      // Reset the timer
      handleReset()
    } else if (subject !== "Revision") {
      // Show next question notification
      toast({
        title: `Starting question #${currentQuestionRef.current + 1}`,
        description: `You have ${subject === "Mathematics" ? "8" : subject === "Physics" ? "5" : "3"} minutes to complete this ${subject} question.`,
      })
    }
  }
  
  // Handle countdown
  useEffect(() => {
    if (showCountdown && countdown > 0) {
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            setShowCountdown(false)
            setIsActive(true)
            setIsPaused(false)
            
            // Play beep to indicate timer has started
            playBeep(1)
            
            toast({
              title: `${subject} timer started`,
              description: subject === "Revision" 
                ? "Revision time: 1 hour before starting practice questions" 
                : `Each ${subject} question: ${subject === "Mathematics" ? "8" : subject === "Physics" ? "5" : "3"} minutes`,
            })
            
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(countdownInterval)
    }
  }, [showCountdown, countdown, subject])

  // Handle timer start
  const handleStart = () => {
    // Start with a 3-second countdown
    setCountdown(3)
    setShowCountdown(true)
    
    toast({
      title: `Starting ${subject} timer in 3 seconds`,
      description: "Get ready!",
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
    setShowCountdown(false)
    setCountdown(0)
    setTimeRemaining(getQuestionDuration())
    setCompletedQuestions(0)
    currentQuestionRef.current = 0
    
    // Calculate total time based on subject and number of questions
    const newTotalTime = totalDuration ? totalDuration * 60 : 
      (subject === "Revision" ? 60 * 60 : // 1 hour for revision
       getQuestionDuration() * Math.max(1, totalQuestions)) // Ensure we don't multiply by 0
    
    setTotalTimeRemaining(newTotalTime)
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    console.log(`Timer reset for ${subject}. Question duration: ${getQuestionDuration()/60} minutes, Total time: ${newTotalTime/60} minutes`)
  }
  
  // Handle timer complete
  const handleComplete = () => {
    setIsActive(false)
    setIsPaused(false)
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    // Play completion sound (3 beeps)
    playBeep(3)
    
    // Show completion toast
    toast({
      title: `${subject} session complete!`,
      description: subject === "Revision"
        ? "Now you can start practicing questions."
        : "Take a 20-minute break before starting the next subject.",
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
  
  // Format total time as HH:MM:SS
  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Get color based on subject
  const getSubjectColor = () => {
    switch (subject) {
      case "Mathematics":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "Physics":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Chemistry":
        return "bg-green-100 text-green-800 border-green-200"
      case "Revision":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }
  
  // Calculate progress percentage
  const getQuestionProgress = () => {
    const total = getQuestionDuration()
    // Ensure the progress is between 0 and 100
    const progress = ((total - timeRemaining) / total) * 100
    return Math.max(0, Math.min(100, progress))
  }
  
  const getTotalProgress = () => {
    const total = totalDuration ? totalDuration * 60 : (subject === "Revision" ? 60 * 60 : getQuestionDuration() * totalQuestions)
    // Ensure the progress is between 0 and 100
    const progress = ((total - totalTimeRemaining) / total) * 100
    return Math.max(0, Math.min(100, progress))
  }
  
  return (
    <>
      <Card className={`${isActive ? "border-2 border-blue-500" : ""}`}>
        <CardHeader className={`${getSubjectColor()} rounded-t-lg`}>
          <CardTitle className="flex items-center justify-between">
            <span>{subject} Timer</span>
            {isActive && <span className="animate-pulse">⏱️</span>}
          </CardTitle>
          <CardDescription>
            {subject === "Revision" 
              ? "1 hour continuous revision session" 
              : subject === "Mathematics" 
                ? "8 minutes per question (Math)" 
                : subject === "Physics" 
                  ? "5 minutes per question (Physics)" 
                  : "3 minutes per question (Chemistry)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {/* Current question timer */}
            <div>
              <div className="text-sm text-gray-500 mb-1">
                {subject !== "Revision" ? 
                  `Question #${currentQuestionRef.current + 1} Timer` : 
                  "Revision Timer"}
              </div>
              <div className="text-3xl font-bold mb-2">{formatTime(timeRemaining)}</div>
              <Progress value={getQuestionProgress()} className="h-2 mb-1" />
              {subject !== "Revision" && (
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(getQuestionProgress())}% of question time used
                </p>
              )}
            </div>
            
            {/* Question progress */}
            {subject !== "Revision" && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Question Progress</div>
                <div className="flex items-center justify-center mb-2">
                  <span className="text-xl font-bold">{completedQuestions}</span>
                  <span className="text-gray-500 mx-1">/</span>
                  <span className="text-gray-700">{totalQuestions}</span>
                </div>
                <Progress 
                  value={(completedQuestions / Math.max(1, totalQuestions)) * 100} 
                  className="h-2 mb-1" 
                />
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((completedQuestions / Math.max(1, totalQuestions)) * 100)}% complete
                </p>
              </div>
            )}
            
            {/* Total session timer */}
            <div>
              <div className="text-sm text-gray-500 mb-1">Total Session Time</div>
              <div className="text-xl font-medium mb-2">{formatTotalTime(totalTimeRemaining)}</div>
              <Progress value={getTotalProgress()} className="h-2 mb-1" />
            </div>
            
            {/* Timer controls */}
            <div className="flex justify-center space-x-2 mt-4">
              {showCountdown ? (
                <div className="flex flex-col items-center">
                  <div className="text-4xl font-bold mb-2">{countdown}</div>
                  <p className="text-sm text-gray-500">Starting soon...</p>
                </div>
              ) : !isActive ? (
                <Button onClick={handleStart}>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </Button>
              ) : isPaused && !showCompletionDialog ? (
                <Button onClick={handleResume}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              ) : !showCompletionDialog ? (
                <Button onClick={handlePause}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              ) : null}
              {!showCountdown && (
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Question Completion Dialog */}
      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Question #{currentQuestionRef.current + 1} Timer Complete</DialogTitle>
            <DialogDescription>
              Have you completed this {subject} question?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className={`p-4 rounded-lg ${getSubjectColor()}`}>
              <p className="text-center text-lg font-medium">
                Time's up for question #{currentQuestionRef.current + 1}!
              </p>
              <p className="text-center mt-2">
                You've spent {subject === "Mathematics" ? "8" : subject === "Physics" ? "5" : "3"} minutes on this question.
              </p>
              <p className="text-center mt-2">
                Current progress: {completedQuestions}/{totalQuestions} questions completed
              </p>
            </div>
          </div>
          <DialogFooter className="flex justify-center space-x-4">
            <Button 
              onClick={() => handleQuestionCompletion(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Yes, completed
            </Button>
            <Button 
              variant="outline"
              onClick={() => handleQuestionCompletion(false)}
            >
              <X className="h-4 w-4 mr-2" />
              No, need more time
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}