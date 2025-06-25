"use client"

import React, { useEffect, useState } from 'react'
import { Brain, BookOpen, Target, Award, Lightbulb, TrendingUp, Sparkles, Star } from 'lucide-react'

interface SciFiStudentProps {
  state: 'sad' | 'happy' | 'transforming'
  showScreens?: boolean
}

export default function SciFiStudent({ state = 'sad', showScreens = true }: SciFiStudentProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [screenText, setScreenText] = useState<string[]>([
    'Struggling with concepts',
    'Feeling overwhelmed',
    'Lacking clear direction',
    'Motivation decreasing'
  ])

  useEffect(() => {
    setIsVisible(true)
    
    // Simulate screen text changes
    if (state === 'transforming') {
      const interval = setInterval(() => {
        setScreenText([
          'Building understanding',
          'Finding focus areas',
          'Creating a plan',
          'Gaining momentum'
        ])
      }, 1000)
      
      return () => clearInterval(interval)
    }
    
    if (state === 'happy') {
      setScreenText([
        'Concepts mastered',
        'Clear focus established',
        'Effective study routine',
        'Confidence growing'
      ])
    }
  }, [state])

  return (
    <div className={`student-visualization ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000 relative`}>
      {/* Main student figure */}
      <div className="relative mx-auto w-64 h-64">
        {/* Glowing aura around student */}
        <div className={`absolute inset-0 rounded-full 
          ${state === 'sad' ? 'bg-gray-800/20' : 
            state === 'transforming' ? 'bg-gradient-to-r from-[#FACC15]/30 to-[#60A5FA]/30 animate-gentle-pulse' : 
            'bg-gradient-to-r from-[#60A5FA]/30 to-[#10B981]/30 animate-gentle-pulse'}
          transition-all duration-700`}>
        </div>
        
        {/* Student silhouette */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40">
          <div className={`w-24 h-24 rounded-full mx-auto mb-2 
            ${state === 'sad' ? 'bg-gray-700' : 
              state === 'transforming' ? 'bg-gradient-to-r from-[#FACC15] to-[#F59E0B] animate-pulse' : 
              'bg-gradient-to-r from-[#60A5FA] to-[#3B82F6]'}
            transition-all duration-700 flex items-center justify-center overflow-hidden`}>
            
            {/* Face expression */}
            {state === 'sad' ? (
              <div className="flex flex-col items-center justify-center">
                <div className="flex space-x-4 mb-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                </div>
                <div className="w-6 h-1 bg-gray-400 rounded-full transform rotate-180"></div>
              </div>
            ) : state === 'transforming' ? (
              <div className="flex flex-col items-center justify-center">
                <div className="flex space-x-4 mb-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                </div>
                <div className="w-6 h-1 bg-white rounded-full"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="flex space-x-4 mb-2">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="w-6 h-1 bg-white rounded-full transform rotate-0 scale-y-150"></div>
              </div>
            )}
          </div>
          
          {/* Body */}
          <div className={`w-32 h-40 mx-auto -mt-6 rounded-t-3xl 
            ${state === 'sad' ? 'bg-gray-700' : 
              state === 'transforming' ? 'bg-gradient-to-b from-[#FACC15] to-[#F59E0B] animate-pulse' : 
              'bg-gradient-to-b from-[#60A5FA] to-[#3B82F6]'}
            transition-all duration-700 relative`}>
            
            {/* Center emblem */}
            <div className={`absolute top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full 
              ${state === 'sad' ? 'bg-gray-800' : 
                state === 'transforming' ? 'bg-[#F59E0B]' : 
                'bg-[#3B82F6]'}
              flex items-center justify-center transition-all duration-700`}>
              
              {state === 'sad' ? (
                <Lightbulb className="h-8 w-8 text-gray-500" />
              ) : state === 'transforming' ? (
                <Brain className="h-8 w-8 text-[#FACC15] animate-pulse" />
              ) : (
                <Star className="h-8 w-8 text-[#FACC15]" />
              )}
            </div>
            
            {/* Arms */}
            <div className={`absolute -left-6 top-10 w-6 h-24 rounded-l-lg
              ${state === 'sad' ? 'bg-gray-700' : 
                state === 'transforming' ? 'bg-[#FACC15]' : 
                'bg-[#60A5FA]'}
              transition-all duration-700 transform ${state === 'happy' ? 'rotate-[-15deg]' : 'rotate-0'}`}>
            </div>
            
            <div className={`absolute -right-6 top-10 w-6 h-24 rounded-r-lg
              ${state === 'sad' ? 'bg-gray-700' : 
                state === 'transforming' ? 'bg-[#FACC15]' : 
                'bg-[#60A5FA]'}
              transition-all duration-700 transform ${state === 'happy' ? 'rotate-[15deg]' : 'rotate-0'}`}>
            </div>
          </div>
        </div>
        
        {/* Floating elements around student */}
        {state === 'happy' && (
          <>
            {/* Books */}
            <div className="absolute top-0 left-1/4 animate-float" style={{animationDelay: '0.2s'}}>
              <div className="relative">
                <BookOpen className="h-8 w-8 text-[#60A5FA]" />
                <div className="absolute -inset-1 bg-[#60A5FA]/20 rounded-full animate-gentle-pulse"></div>
              </div>
            </div>
            
            {/* Brain */}
            <div className="absolute top-1/4 right-0 animate-float" style={{animationDelay: '0.5s'}}>
              <div className="relative">
                <Brain className="h-8 w-8 text-[#10B981]" />
                <div className="absolute -inset-1 bg-[#10B981]/20 rounded-full animate-gentle-pulse"></div>
              </div>
            </div>
            
            {/* Target */}
            <div className="absolute bottom-1/4 left-0 animate-float" style={{animationDelay: '0.8s'}}>
              <div className="relative">
                <Target className="h-8 w-8 text-[#FACC15]" />
                <div className="absolute -inset-1 bg-[#FACC15]/20 rounded-full animate-gentle-pulse"></div>
              </div>
            </div>
            
            {/* Award */}
            <div className="absolute bottom-0 right-1/4 animate-float" style={{animationDelay: '1.1s'}}>
              <div className="relative">
                <Award className="h-8 w-8 text-[#A855F7]" />
                <div className="absolute -inset-1 bg-[#A855F7]/20 rounded-full animate-gentle-pulse"></div>
              </div>
            </div>
          </>
        )}
        
        {/* Transformation particles */}
        {state === 'transforming' && (
          <>
            <div className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full bg-[#FACC15] animate-ping"></div>
            <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-[#60A5FA] animate-ping" style={{animationDelay: '0.3s'}}></div>
            <div className="absolute bottom-1/3 left-1/3 w-4 h-4 rounded-full bg-[#FACC15] animate-ping" style={{animationDelay: '0.6s'}}></div>
            <div className="absolute bottom-1/4 right-1/3 w-3 h-3 rounded-full bg-[#60A5FA] animate-ping" style={{animationDelay: '0.9s'}}></div>
          </>
        )}
      </div>
      
      {/* Insight bubbles */}
      {showScreens && (
        <>
          <div className={`insight-bubble absolute -top-10 -left-40 w-36 
            ${state === 'happy' ? 'border-[#60A5FA] bg-[#60A5FA]/10' : 'border-gray-500 bg-gray-900/20'} 
            border-2 rounded-full p-3 animate-float`} style={{animationDelay: '0.2s'}}>
            <div className="flex items-center mb-1">
              {state === 'happy' ? 
                <Brain className="h-4 w-4 text-[#60A5FA] mr-2" /> : 
                <Brain className="h-4 w-4 text-gray-400 mr-2" />
              }
              <span className="text-xs font-medium">{screenText[0]}</span>
            </div>
          </div>
          
          <div className={`insight-bubble absolute top-20 -right-40 w-40 
            ${state === 'happy' ? 'border-[#10B981] bg-[#10B981]/10' : 'border-gray-500 bg-gray-900/20'} 
            border-2 rounded-full p-3 animate-float`} style={{animationDelay: '0.5s'}}>
            <div className="flex items-center mb-1">
              {state === 'happy' ? 
                <Target className="h-4 w-4 text-[#10B981] mr-2" /> : 
                <Target className="h-4 w-4 text-gray-400 mr-2" />
              }
              <span className="text-xs font-medium">{screenText[1]}</span>
            </div>
          </div>
          
          <div className={`insight-bubble absolute top-60 -left-36 w-36 
            ${state === 'happy' ? 'border-[#FACC15] bg-[#FACC15]/10' : 'border-gray-500 bg-gray-900/20'} 
            border-2 rounded-full p-3 animate-float`} style={{animationDelay: '0.8s'}}>
            <div className="flex items-center mb-1">
              {state === 'happy' ? 
                <BookOpen className="h-4 w-4 text-[#FACC15] mr-2" /> : 
                <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
              }
              <span className="text-xs font-medium">{screenText[2]}</span>
            </div>
          </div>
          
          <div className={`insight-bubble absolute top-80 -right-32 w-32 
            ${state === 'happy' ? 'border-[#A855F7] bg-[#A855F7]/10' : 'border-gray-500 bg-gray-900/20'} 
            border-2 rounded-full p-3 animate-float`} style={{animationDelay: '1.1s'}}>
            <div className="flex items-center mb-1">
              {state === 'happy' ? 
                <TrendingUp className="h-4 w-4 text-[#A855F7] mr-2" /> : 
                <TrendingUp className="h-4 w-4 text-gray-400 mr-2" />
              }
              <span className="text-xs font-medium">{screenText[3]}</span>
            </div>
          </div>
        </>
      )}
      
      {/* Mindset indicator for sad state */}
      {state === 'sad' && (
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 
          bg-gray-800/80 backdrop-blur-sm border border-gray-600 text-gray-300 px-4 py-2 rounded-full 
          font-medium text-sm animate-float">
          Feeling stuck 😔
        </div>
      )}
      
      {/* Energy field for transforming state */}
      {state === 'transforming' && (
        <div className="absolute inset-0 rounded-full border-2 border-[#FACC15] opacity-30 animate-pulse"></div>
      )}
      
      {/* Inspiration aura for happy state */}
      {state === 'happy' && (
        <div className="absolute -inset-12 rounded-full border border-[#60A5FA]/30">
          <div className="absolute inset-0 bg-gradient-to-r from-[#60A5FA]/5 to-[#10B981]/5 rounded-full animate-gentle-pulse"></div>
          <div className="absolute top-1/2 left-1/2 w-24 h-24 border border-[#60A5FA]/30 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-gentle-pulse" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-40 h-40 border border-[#60A5FA]/20 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-gentle-pulse" style={{animationDelay: '1s'}}></div>
        </div>
      )}
      
      {/* Light particles */}
      {(state === 'transforming' || state === 'happy') && (
        <>
          <div className="absolute top-20 left-20 w-2 h-2 rounded-full bg-[#FACC15]/70 animate-float" style={{animationDelay: '0.2s'}}></div>
          <div className="absolute top-40 right-20 w-1.5 h-1.5 rounded-full bg-[#60A5FA]/70 animate-float" style={{animationDelay: '0.4s'}}></div>
          <div className="absolute top-60 left-30 w-3 h-3 rounded-full bg-[#10B981]/70 animate-float" style={{animationDelay: '0.6s'}}></div>
          <div className="absolute top-80 right-30 w-2 h-2 rounded-full bg-[#A855F7]/70 animate-float" style={{animationDelay: '0.8s'}}></div>
        </>
      )}
      
      {/* Confidence indicator for happy state */}
      {state === 'happy' && (
        <div className="absolute top-[105%] left-1/2 transform -translate-x-1/2 w-48 
          bg-[#0F172A]/80 backdrop-blur-sm rounded-full border border-[#60A5FA]/50 py-2 px-4 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-[#FACC15] mr-2" />
          <span className="text-[#F8FAFC] font-medium text-sm">Confidence Unlocked!</span>
        </div>
      )}
    </div>
  )
}