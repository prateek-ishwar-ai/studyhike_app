"use client"

import React, { useEffect, useState } from 'react'

interface EnergyFlowProps {
  active: boolean
  color?: string
  pulseCount?: number
  variant?: 'blue' | 'yellow' | 'purple'
}

export default function EnergyFlow({ 
  active = false, 
  color = '#60A5FA', // blue
  pulseCount = 5,
  variant = 'blue'
}: EnergyFlowProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [pulses, setPulses] = useState<{top: string, delay: string}[]>([])

  useEffect(() => {
    if (active) {
      setIsVisible(true)
      
      // Create energy pulses
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
      case 'yellow':
        return '#FACC15' // yellow
      case 'purple':
        return '#A855F7' // purple
      default:
        return color
    }
  }

  const flowColor = getColor()

  return (
    <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-4 z-10 overflow-visible">
      {/* Main energy flow line */}
      <div 
        className={`h-full w-full transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          background: `linear-gradient(to bottom, ${flowColor}33, ${flowColor}66, ${flowColor}99, ${flowColor})`
        }}
      ></div>
      
      {/* Energy nodes */}
      <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-10 
        rounded-full border border-[${flowColor}] transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className={`absolute inset-1 rounded-full bg-[${flowColor}] opacity-30 animate-gentle-pulse`}></div>
      </div>
      
      <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-10 
        rounded-full border border-[${flowColor}] transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className={`absolute inset-1 rounded-full bg-[${flowColor}] opacity-30 animate-gentle-pulse`}></div>
      </div>
      
      {/* Energy pulses */}
      {pulses.map((pulse, index) => (
        <div 
          key={index}
          className={`w-6 h-6 rounded-full 
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
      
      {/* Horizontal energy branches */}
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
      
      {/* Energy connection points */}
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
      
      {/* Decorative energy elements */}
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