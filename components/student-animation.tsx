"use client"

import React, { useEffect, useState } from 'react'

interface StudentAnimationProps {
  state: 'sad' | 'happy'
  showThoughts?: boolean
}

export default function StudentAnimation({ state = 'sad', showThoughts = true }: StudentAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className={`student-3d ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`}>
      {/* Student head */}
      <div className={`student-head ${state === 'sad' ? 'student-sad' : 'student-happy'} transition-transform duration-1000`}>
        {/* Face expression */}
        <div className="relative w-full h-full">
          {/* Eyes */}
          <div className="absolute top-[30%] left-[25%] w-6 h-3 flex justify-between">
            <div className="w-2 h-2 rounded-full bg-[#0F172A]"></div>
          </div>
          <div className="absolute top-[30%] right-[25%] w-6 h-3 flex justify-between">
            <div className="w-2 h-2 rounded-full bg-[#0F172A]"></div>
          </div>
          
          {/* Mouth - sad or happy */}
          {state === 'sad' ? (
            <div className="absolute bottom-[30%] left-1/2 transform -translate-x-1/2 w-8 h-3 border-b-2 border-[#0F172A] rounded-b-full"></div>
          ) : (
            <div className="absolute bottom-[30%] left-1/2 transform -translate-x-1/2 w-8 h-3 border-t-2 border-[#0F172A] rounded-t-full"></div>
          )}
        </div>
      </div>
      
      {/* Student body */}
      <div className={`student-body ${state === 'sad' ? 'student-sad' : 'student-happy'} transition-transform duration-1000`}></div>
      
      {/* Arms */}
      <div className={`student-arm-left ${state === 'sad' ? 'student-sad' : 'student-happy'} transition-transform duration-1000`}></div>
      <div className={`student-arm-right ${state === 'sad' ? 'student-sad' : 'student-happy'} transition-transform duration-1000`}></div>
      
      {/* Thought bubbles */}
      {showThoughts && state === 'sad' && (
        <>
          <div className="thought-bubble thought-bubble-1">
            "I don't understand this concept..."
          </div>
          <div className="thought-bubble thought-bubble-2">
            "My rank is dropping..."
          </div>
          <div className="thought-bubble thought-bubble-3">
            "How will I pass JEE?"
          </div>
        </>
      )}
      
      {/* Energy glow for happy state */}
      {state === 'happy' && (
        <div className="absolute inset-0 rounded-full bg-[#FACC15] opacity-20 animate-pulse-glow"></div>
      )}
    </div>
  )
}