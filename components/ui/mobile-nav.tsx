"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useIsMobile } from '@/hooks/use-mobile'
import { 
  Home, 
  BookOpen, 
  Calendar, 
  MessageCircle, 
  User, 
  Settings,
  ChevronUp,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react'
import { Button } from './button'
import { Badge } from './badge'

export function MobileNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(3)
  const pathname = usePathname()
  const { profile } = useAuth()
  const isMobile = useIsMobile()

  if (!isMobile) return null

  const getNavItems = () => {
    const baseItems = [
      { href: `/${profile?.role}/dashboard`, icon: Home, label: 'Home' },
      { href: `/${profile?.role}/study-plan`, icon: BookOpen, label: 'Study' },
      { href: `/${profile?.role}/sessions`, icon: Calendar, label: 'Sessions' },
      { href: `/${profile?.role}/messages`, icon: MessageCircle, label: 'Messages' },
      { href: `/${profile?.role}/profile`, icon: User, label: 'Profile' },
    ]

    return baseItems
  }

  const navItems = profile ? getNavItems() : []

  const isActiveRoute = (href: string) => {
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Top Mobile Header */}
      <div className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-1.5 rounded-lg">
              <span role="img" aria-label="bulb" className="text-lg">💡</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">StudyHike</h1>
              <p className="text-xs text-gray-400 capitalize">
                {profile?.role} Dashboard
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="relative p-2">
              <Search className="h-5 w-5 text-gray-400" />
            </button>
            
            <button className="relative p-2">
              <Bell className="h-5 w-5 text-gray-400" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500 text-white flex items-center justify-center">
                  {notificationCount}
                </Badge>
              )}
            </button>
            
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 text-gray-400" />
              ) : (
                <Menu className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Slide-out Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[80vw] bg-gray-900 border-l border-gray-800 p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white">Menu</h2>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = isActiveRoute(item.href)
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
              
              <hr className="border-gray-800 my-4" />
              
              <Link
                href={`/${profile?.role}/settings`}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings className="h-5 w-5" />
                <span className="font-medium">Settings</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 z-40">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const isActive = isActiveRoute(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 ${
                  isActive 
                    ? 'text-yellow-400' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className={`h-5 w-5 mb-1 ${isActive ? 'text-yellow-400' : ''}`} />
                <span className={`text-xs font-medium truncate ${
                  isActive ? 'text-yellow-400' : 'text-gray-500'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 bg-yellow-400 rounded-full mt-1" />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Content Padding */}
      <div className="h-16" /> {/* Top padding */}
      <div className="h-20" /> {/* Bottom padding */}
    </>
  )
}

// Quick Action Floating Button
export function MobileQuickAction() {
  const [isExpanded, setIsExpanded] = useState(false)
  const isMobile = useIsMobile()

  if (!isMobile) return null

  return (
    <div className="fixed bottom-24 right-4 z-30">
      {isExpanded && (
        <div className="absolute bottom-16 right-0 bg-gray-900 border border-gray-700 rounded-lg p-2 space-y-2 shadow-xl">
          <Button size="sm" className="w-full justify-start text-left bg-blue-600 hover:bg-blue-700">
            <MessageCircle className="h-4 w-4 mr-2" />
            Ask Mentor
          </Button>
          <Button size="sm" className="w-full justify-start text-left bg-green-600 hover:bg-green-700">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Session
          </Button>
          <Button size="sm" className="w-full justify-start text-left bg-purple-600 hover:bg-purple-700">
            <Search className="h-4 w-4 mr-2" />
            Quick Search
          </Button>
        </div>
      )}
      
      <Button
        size="lg"
        className="rounded-full h-14 w-14 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-lg hover:shadow-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <X className="h-6 w-6" />
        ) : (
          <ChevronUp className="h-6 w-6" />
        )}
      </Button>
    </div>
  )
}