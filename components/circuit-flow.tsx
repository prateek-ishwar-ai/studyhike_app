"use client"

import React, { useEffect, useState } from 'react'

interface StudentFlowProps {
  active: boolean
  color?: string
  pulseCount?: number
  variant?: 'forest' | 'river' | 'mountain'
}

export default function CircuitFlow({ 
  active = false, 
  color = '#3B82F6', // blue-500
  pulseCount = 5,
  variant = 'forest'
}: StudentFlowProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [pulses, setPulses] = useState<{top: string, delay: string}[]>([])

  useEffect(() => {
    if (active) {
      setIsVisible(true)
      
      // Create student journey pulses
      const newPulses = Array.from({ length: pulseCount }).map((_, index) => ({
        top: `${(index + 1) * (100 / (pulseCount + 1))}%`,
        delay: `${index * 0.3}s`
      }))
      
      setPulses(newPulses)
    }
  }, [active, pulseCount])

  // Get color based on variant
  const getColor = () => {
    switch (variant) {
      case 'forest':
        return '#3B82F6' // blue-500
      case 'river':
        return '#6366F1' // indigo-500
      case 'mountain':
        return '#8B5CF6' // purple-500
      default:
        return color
    }
  }

  const flowColor = getColor()

  return (
    <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-4 z-10 overflow-visible">
      {/* Main student flow line */}
      <div 
        className={`student-line h-full w-full transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          background: variant === 'river' 
            ? `linear-gradient(to bottom, transparent, ${flowColor}33, ${flowColor}66, ${flowColor}99, ${flowColor})` 
            : variant === 'mountain'
              ? `linear-gradient(to bottom, ${flowColor}, ${flowColor}99, ${flowColor}66, ${flowColor}33, transparent)`
              : `linear-gradient(to bottom, ${flowColor}33, ${flowColor}, ${flowColor}33)`
        }}
      ></div>
      
      {/* Student journey nodes */}
      <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-10 
        rounded-full border border-[${flowColor}] transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className={`absolute inset-1 rounded-full bg-[${flowColor}] opacity-30 animate-gentle-pulse`}></div>
      </div>
      
      <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-10 
        rounded-full border border-[${flowColor}] transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className={`absolute inset-1 rounded-full bg-[${flowColor}] opacity-30 animate-gentle-pulse`}></div>
      </div>
      
      {/* Student journey pulses */}
      {pulses.map((pulse, index) => (
        <div 
          key={index}
          className={`student-pulse w-6 h-6 rounded-full 
            absolute left-1/2 transform -translate-x-1/2
            animate-gentle-pulse transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            top: pulse.top, 
            animationDelay: pulse.delay,
            backgroundColor: `${flowColor}33`
          }}
        >
          <div className="absolute inset-2 rounded-full" style={{ backgroundColor: flowColor, opacity: 0.3 }}></div>
        </div>
      ))}
      
      {/* Horizontal student journey branches */}
      <div className={`absolute top-[25%] left-0 w-20 h-0.5 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'} animate-gentle-flow`} 
        style={{ 
          transitionDelay: '0.5s',
          background: `linear-gradient(to right, ${flowColor}, transparent)`
        }}>
      </div>
      
      <div className={`absolute top-[50%] right-0 w-20 h-0.5 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'} animate-gentle-flow`} 
        style={{ 
          transitionDelay: '0.8s',
          background: `linear-gradient(to left, ${flowColor}, transparent)`
        }}>
      </div>
      
      <div className={`absolute top-[75%] left-0 w-20 h-0.5 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'} animate-gentle-flow`} 
        style={{ 
          transitionDelay: '1.1s',
          background: `linear-gradient(to right, ${flowColor}, transparent)`
        }}>
      </div>
      
      {/* Student journey connection points */}
      <div className={`absolute top-[25%] left-0 w-6 h-6 
        rounded-full border border-[${flowColor}] transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
        style={{ transitionDelay: '0.5s' }}>
        <div className={`absolute inset-1 rounded-full bg-[${flowColor}] opacity-30 animate-gentle-pulse`}></div>
      </div>
      
      <div className={`absolute top-[50%] right-0 w-6 h-6 
        rounded-full border border-[${flowColor}] transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
        style={{ transitionDelay: '0.8s' }}>
        <div className={`absolute inset-1 rounded-full bg-[${flowColor}] opacity-30 animate-gentle-pulse`}></div>
      </div>
      
      <div className={`absolute top-[75%] left-0 w-6 h-6 
        rounded-full border border-[${flowColor}] transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
        style={{ transitionDelay: '1.1s' }}>
        <div className={`absolute inset-1 rounded-full bg-[${flowColor}] opacity-30 animate-gentle-pulse`}></div>
      </div>
      
      {/* Decorative student journey elements */}
      {isVisible && (
        <>
          <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2 w-40 h-px opacity-10"
            style={{ background: `radial-gradient(circle, ${flowColor} 0%, transparent 70%)` }}></div>
          <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 w-60 h-px opacity-10"
            style={{ background: `radial-gradient(circle, ${flowColor} 0%, transparent 70%)` }}></div>
          <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 w-40 h-px opacity-10"
            style={{ background: `radial-gradient(circle, ${flowColor} 0%, transparent 70%)` }}></div>
          <div className="absolute top-[80%] left-1/2 transform -translate-x-1/2 w-60 h-px opacity-10"
            style={{ background: `radial-gradient(circle, ${flowColor} 0%, transparent 70%)` }}></div>
        </>
      )}
    </div>
  )
}