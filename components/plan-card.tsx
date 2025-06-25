"use client"

import React, { useState } from 'react'
import { CheckCircle, ChevronRight, X, Leaf, Mountain, Sunrise } from 'lucide-react'
import SciFiButton from './sci-fi-button'
import { cn } from '@/lib/utils'

interface PlanFeature {
  text: string
  included: boolean
}

interface PlanCardProps {
  title: string
  description: string
  price: string
  features: PlanFeature[]
  variant: 'free' | 'standard' | 'premium'
  popular?: boolean
  className?: string
  onSelect?: () => void
}

export default function PlanCard({
  title,
  description,
  price,
  features,
  variant,
  popular = false,
  className,
  onSelect
}: PlanCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'free':
        return 'nature-card-basic bg-emerald-50 border-emerald-200'
      case 'standard':
        return 'nature-card-standard bg-sky-50 border-sky-200'
      case 'premium':
        return 'nature-card-premium bg-amber-50 border-amber-200'
      default:
        return 'nature-card bg-emerald-50 border-emerald-200'
    }
  }
  
  const getButtonVariant = () => {
    switch (variant) {
      case 'free':
        return 'default'
      case 'standard':
        return 'warning'
      case 'premium':
        return 'attack'
      default:
        return 'default'
    }
  }
  
  const getIconColor = () => {
    switch (variant) {
      case 'free':
        return 'text-emerald-600'
      case 'standard':
        return 'text-sky-600'
      case 'premium':
        return 'text-amber-600'
      default:
        return 'text-emerald-600'
    }
  }
  
  const getHeaderText = () => {
    switch (variant) {
      case 'free':
        return 'Seedling Path'
      case 'standard':
        return 'River Journey'
      case 'premium':
        return 'Mountain Summit'
      default:
        return 'Nature Path'
    }
  }
  
  const getHeaderIcon = () => {
    switch (variant) {
      case 'free':
        return <Leaf className={`h-6 w-6 ${getIconColor()}`} />
      case 'standard':
        return <Sunrise className={`h-6 w-6 ${getIconColor()}`} />
      case 'premium':
        return <Mountain className={`h-6 w-6 ${getIconColor()}`} />
      default:
        return <Leaf className={`h-6 w-6 ${getIconColor()}`} />
    }
  }
  
  const playHoverSound = () => {
    const audio = new Audio('/sounds/hover.mp3')
    audio.volume = 0.1
    audio.play().catch(e => console.log('Audio play failed:', e))
  }

  return (
    <div 
      className={cn(
        'rounded-xl overflow-hidden border shadow-lg transition-all duration-300 relative',
        getVariantClasses(),
        isHovered ? 'translate-y-[-4px]' : '',
        className
      )}
      onMouseEnter={() => {
        setIsHovered(true)
        playHoverSound()
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Natural decorative elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-current to-transparent opacity-30"></div>
      
      {popular && (
        <div className="absolute -right-10 top-6 bg-sky-500 text-white py-1 px-10 transform rotate-45 text-xs font-medium z-10">
          Recommended
        </div>
      )}
      
      <div className="p-1">
        <div className="bg-white/80 p-5 rounded-t-lg">
          <div className="flex items-center gap-2 mb-2">
            {getHeaderIcon()}
            <div className="font-serif text-sm tracking-wide text-gray-600">
              {getHeaderText()}
            </div>
          </div>
          
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-gray-800 font-serif">{title}</h3>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center animate-gentle-pulse ${variant === 'premium' ? 'bg-amber-100' : variant === 'standard' ? 'bg-sky-100' : 'bg-emerald-100'}`}>
              {getHeaderIcon()}
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-4">{description}</p>
          
          <div className="flex items-baseline">
            <div className="text-2xl font-bold text-gray-800">{price}</div>
            {price !== 'Free' && <div className="text-gray-500 text-xs ml-1">/month</div>}
          </div>
        </div>
        
        <div className="p-5 bg-white/60">
          <ul className="space-y-3 mb-6">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start">
                {feature.included ? (
                  <CheckCircle className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${getIconColor()}`} />
                ) : (
                  <X className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-gray-400" />
                )}
                <span className={`text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
          
          <SciFiButton 
            variant={getButtonVariant()} 
            className="w-full justify-center"
            onClick={onSelect}
            withSound={true}
          >
            {variant === 'premium' ? 'Begin Summit Journey' : variant === 'standard' ? 'Start River Path' : 'Start Growing'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </SciFiButton>
        </div>
      </div>
      
      {/* Natural decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-current to-transparent opacity-30"></div>
      
      {/* Gentle hover effects */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-t from-current to-transparent opacity-5"></div>
      )}
    </div>
  )
}