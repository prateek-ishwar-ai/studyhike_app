"use client"

import { ReactNode, useEffect, useState } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { Smartphone, Wifi, WifiOff, Battery, BatteryLow } from 'lucide-react'

interface MobileAppLayoutProps {
  children: ReactNode
  showStatusBar?: boolean
  title?: string
}

export function MobileAppLayout({ children, showStatusBar = true, title }: MobileAppLayoutProps) {
  const isMobile = useIsMobile()
  const [isOnline, setIsOnline] = useState(true)
  const [batteryLevel, setBatteryLevel] = useState(100)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    // Update time every minute
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    
    updateTime()
    const timeInterval = setInterval(updateTime, 60000)

    // Monitor online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOnline(navigator.onLine)

    // Mock battery level (in real app, you'd use Battery API)
    const updateBattery = () => {
      setBatteryLevel(Math.floor(Math.random() * 30) + 70) // 70-100%
    }
    updateBattery()
    const batteryInterval = setInterval(updateBattery, 300000) // 5 minutes

    return () => {
      clearInterval(timeInterval)
      clearInterval(batteryInterval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isMobile) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile Status Bar */}
      {showStatusBar && (
        <div className="bg-black/90 backdrop-blur-sm px-4 py-2 flex items-center justify-between text-sm font-medium sticky top-0 z-50">
          <div className="flex items-center space-x-2">
            <span>{currentTime}</span>
            {!isOnline && <WifiOff className="h-4 w-4 text-red-400" />}
            {isOnline && <Wifi className="h-4 w-4 text-green-400" />}
          </div>
          
          {title && (
            <div className="flex-1 text-center">
              <span className="text-white font-semibold">{title}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {batteryLevel < 20 ? (
                <BatteryLow className="h-4 w-4 text-red-400" />
              ) : (
                <Battery className="h-4 w-4 text-green-400" />
              )}
              <span className="text-xs">{batteryLevel}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>

      {/* Mobile App Indicator */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/20 to-transparent h-1 pointer-events-none" />
    </div>
  )
}

// Hook to detect if app is running in mobile app vs browser
export function useIsNativeApp() {
  const [isNativeApp, setIsNativeApp] = useState(false)
  
  useEffect(() => {
    // Check if running in Capacitor (native app)
    const isCapacitor = typeof window !== 'undefined' && 
      (window as any).Capacitor !== undefined
    
    // Check user agent for mobile app indicators
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : ''
    const isMobileApp = userAgent.includes('StudyHike') || 
                        userAgent.includes('CapacitorApp') ||
                        isCapacitor
    
    setIsNativeApp(isMobileApp)
  }, [])
  
  return isNativeApp
}