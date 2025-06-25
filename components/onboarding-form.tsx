"use client"

import React, { useState } from 'react'
import { X, CheckCircle, Loader2, BookOpen, GraduationCap, Brain } from 'lucide-react'
import SciFiButton from './sci-fi-button'
import TerminalText from './terminal-text'

interface OnboardingFormProps {
  onClose: () => void
  onSubmit: (data: FormData) => void
  planName?: string
}

export default function OnboardingForm({
  onClose,
  onSubmit,
  planName = 'Standard'
}: OnboardingFormProps) {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormState('submitting')
    
    // Simulate form submission
    setTimeout(() => {
      setFormState('success')
      
      // Create FormData object
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value)
      })
      data.append('plan', planName)
      
      onSubmit(data)
    }, 1500)
  }
  
  const getFormIcon = () => {
    if (planName?.toLowerCase().includes('premium') || planName?.toLowerCase().includes('advanced')) {
      return <Brain className="h-6 w-6 text-purple-600 mr-2" />
    } else if (planName?.toLowerCase().includes('standard') || planName?.toLowerCase().includes('intermediate')) {
      return <GraduationCap className="h-6 w-6 text-indigo-600 mr-2" />
    } else {
      return <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
    }
  }
  
  const getButtonVariant = () => {
    if (planName?.toLowerCase().includes('premium') || planName?.toLowerCase().includes('advanced')) {
      return 'attack' // reusing the button variant names but styled differently
    } else if (planName?.toLowerCase().includes('standard') || planName?.toLowerCase().includes('intermediate')) {
      return 'warning'
    } else {
      return 'default'
    }
  }
  
  const getFormVariant = () => {
    if (planName?.toLowerCase().includes('premium') || planName?.toLowerCase().includes('advanced')) {
      return 'mountain'
    } else if (planName?.toLowerCase().includes('standard') || planName?.toLowerCase().includes('intermediate')) {
      return 'river'
    } else {
      return 'forest'
    }
  }
  
  const getBgColor = () => {
    if (planName?.toLowerCase().includes('premium') || planName?.toLowerCase().includes('advanced')) {
      return 'bg-purple-50'
    } else if (planName?.toLowerCase().includes('standard') || planName?.toLowerCase().includes('intermediate')) {
      return 'bg-indigo-50'
    } else {
      return 'bg-blue-50'
    }
  }
  
  const getBorderColor = () => {
    if (planName?.toLowerCase().includes('premium') || planName?.toLowerCase().includes('advanced')) {
      return 'border-purple-200'
    } else if (planName?.toLowerCase().includes('standard') || planName?.toLowerCase().includes('intermediate')) {
      return 'border-indigo-200'
    } else {
      return 'border-blue-200'
    }
  }

  return (
    <div className={`student-modal relative p-6 max-w-md w-full mx-auto ${getBgColor()} border ${getBorderColor()} rounded-lg shadow-lg`}>
      {/* Student decorative elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-current to-transparent opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-current to-transparent opacity-20"></div>
      
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
      >
        <X className="h-5 w-5" />
      </button>
      
      <div className="mb-6">
        <div className="flex items-center mb-2">
          {getFormIcon()}
          <h3 className="text-xl font-bold text-gray-800">
            {planName?.toLowerCase().includes('premium') ? 'Join Advanced Program' : 'Start Your Success Journey'}
          </h3>
        </div>
        
        <TerminalText 
          text={formState === 'success' 
            ? 'Your academic transformation has begun. Get ready to achieve your full potential!' 
            : `Complete your ${planName} registration to start your success journey.`}
          variant={getFormVariant() as 'forest' | 'river' | 'mountain'}
          typingSpeed={20}
          prefix="success"
        />
      </div>
      
      {formState === 'success' ? (
        <div className="text-center py-8">
          <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full
            ${planName?.toLowerCase().includes('premium') 
              ? 'bg-purple-100 border border-purple-300' 
              : planName?.toLowerCase().includes('standard')
                ? 'bg-indigo-100 border border-indigo-300'
                : 'bg-blue-100 border border-blue-300'}`}>
            <CheckCircle className={`h-8 w-8 
              ${planName?.toLowerCase().includes('premium') 
                ? 'text-purple-600' 
                : planName?.toLowerCase().includes('standard')
                  ? 'text-indigo-600'
                  : 'text-blue-600'}`} />
          </div>
          
          <h4 className="text-lg font-bold text-gray-800 mb-2">Success Journey Started</h4>
          
          <div className="mb-6 p-3 bg-white/60 border border-gray-200 rounded-lg">
            <p className="text-gray-700 text-sm">
              Check your email for your welcome guide and first steps on your academic success path.
            </p>
          </div>
          
          <SciFiButton variant={getButtonVariant()} onClick={onClose}>
            Close Window
          </SciFiButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="relative">
          {/* Subtle academic pattern background */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-opacity-10"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` 
            }}></div>
          
          <div className="space-y-4 mb-6 relative z-10">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <span className="w-1 h-4 inline-block mr-2 bg-current opacity-50 rounded-full"></span>
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className={`w-full bg-white/80 border ${getBorderColor()} text-gray-800 px-3 py-2 rounded-md focus:ring-2 focus:ring-opacity-50 focus:${getBorderColor()} focus:outline-none transition`}
                value={formData.name}
                onChange={handleChange}
                disabled={formState === 'submitting'}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <span className="w-1 h-4 inline-block mr-2 bg-current opacity-50 rounded-full"></span>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className={`w-full bg-white/80 border ${getBorderColor()} text-gray-800 px-3 py-2 rounded-md focus:ring-2 focus:ring-opacity-50 focus:${getBorderColor()} focus:outline-none transition`}
                value={formData.email}
                onChange={handleChange}
                disabled={formState === 'submitting'}
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <span className="w-1 h-4 inline-block mr-2 bg-current opacity-50 rounded-full"></span>
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                className={`w-full bg-white/80 border ${getBorderColor()} text-gray-800 px-3 py-2 rounded-md focus:ring-2 focus:ring-opacity-50 focus:${getBorderColor()} focus:outline-none transition`}
                value={formData.phone}
                onChange={handleChange}
                disabled={formState === 'submitting'}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <SciFiButton
              type="submit"
              variant={getButtonVariant()}
              className="w-full justify-center"
              disabled={formState === 'submitting'}
            >
              {formState === 'submitting' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                planName?.toLowerCase().includes('premium') 
                  ? 'Join Advanced Program' 
                  : 'Start Your Success Journey'
              )}
            </SciFiButton>
          </div>
        </form>
      )}
    </div>
  )
}