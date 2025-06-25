"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StudentButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: 'default' | 'attack' | 'warning' | 'danger'
  size?: 'default' | 'sm' | 'lg'
  withSound?: boolean
  disabled?: boolean
}

export default function SciFiButton({
  children,
  onClick,
  className,
  variant = 'default',
  size = 'default',
  withSound = false,
  disabled = false
}: StudentButtonProps) {
  const handleClick = () => {
    if (disabled) return;
    
    if (withSound) {
      // Play button sound
      const audio = new Audio('/sounds/button-click.mp3')
      audio.volume = 0.3
      audio.play().catch(e => console.log('Audio play failed:', e))
    }
    
    if (onClick) {
      onClick()
    }
  }
  
  const getVariantClasses = () => {
    if (disabled) {
      return 'bg-[#1E293B] text-[#64748B] border border-[#334155] cursor-not-allowed'
    }
    
    switch (variant) {
      case 'attack': // Purple (Premium)
        return 'bg-[#A855F7]/20 text-[#F8FAFC] border border-[#A855F7]/50 hover:bg-[#A855F7]/30 hover:border-[#A855F7] hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:translate-y-0.5 active:shadow-inner'
      case 'warning': // Green (Pro)
        return 'bg-[#10B981]/20 text-[#F8FAFC] border border-[#10B981]/50 hover:bg-[#10B981]/30 hover:border-[#10B981] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] active:translate-y-0.5 active:shadow-inner'
      case 'danger':
        return 'bg-[#EF4444]/20 text-[#F8FAFC] border border-[#EF4444]/50 hover:bg-[#EF4444]/30 hover:border-[#EF4444] hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] active:translate-y-0.5 active:shadow-inner'
      default: // Blue (Basic)
        return 'bg-[#60A5FA]/20 text-[#F8FAFC] border border-[#60A5FA]/50 hover:bg-[#60A5FA]/30 hover:border-[#60A5FA] hover:shadow-[0_0_15px_rgba(96,165,250,0.3)] active:translate-y-0.5 active:shadow-inner'
    }
  }
  
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs py-1.5 px-4 rounded-full'
      case 'lg':
        return 'text-base py-3 px-6 rounded-full'
      default:
        return 'text-sm py-2 px-5 rounded-full'
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'student-button relative font-medium transition-all duration-200 shadow-sm',
        'flex items-center justify-center gap-2',
        getVariantClasses(),
        getSizeClasses(),
        className
      )}
    >
      {/* Button glow effect */}
      <span className="absolute inset-0 rounded-full opacity-20 bg-white/10"></span>
      
      {/* Button content */}
      <span className="relative z-10">{children}</span>
    </button>
  )
}