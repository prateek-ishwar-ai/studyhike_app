"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Home, 
  BookOpen, 
  MessageCircle, 
  User, 
  Calendar,
  Settings,
  Target,
  Clock,
  Trophy
} from "lucide-react"

interface NavItem {
  icon: React.ElementType
  label: string
  path: string
  badge?: string
}

interface MobileNavBarProps {
  userRole?: 'student' | 'mentor' | 'admin'
}

export default function MobileNavBar({ userRole = 'student' }: MobileNavBarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const getNavItems = (): NavItem[] => {
    switch (userRole) {
      case 'student':
        return [
          { icon: Home, label: 'Dashboard', path: '/app/student' },
          { icon: Calendar, label: 'Sessions', path: '/app/student/sessions' },
          { icon: BookOpen, label: 'Study Plan', path: '/app/student/study-plan' },
          { icon: MessageCircle, label: 'Messages', path: '/app/student/messages' },
          { icon: User, label: 'Profile', path: '/app/student/profile' }
        ]
      case 'mentor':
        return [
          { icon: Home, label: 'Dashboard', path: '/app/mentor' },
          { icon: Users, label: 'Students', path: '/app/mentor/students' },
          { icon: Calendar, label: 'Sessions', path: '/app/mentor/sessions' },
          { icon: MessageCircle, label: 'Messages', path: '/app/mentor/messages' },
          { icon: User, label: 'Profile', path: '/app/mentor/profile' }
        ]
      case 'admin':
        return [
          { icon: Home, label: 'Dashboard', path: '/app/admin' },
          { icon: Users, label: 'Users', path: '/app/admin/users' },
          { icon: Trophy, label: 'Reports', path: '/app/admin/reports' },
          { icon: Settings, label: 'Settings', path: '/app/admin/settings' }
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-50"
    >
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item, index) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/')
          const Icon = item.icon
          
          return (
            <motion.button
              key={index}
              onClick={() => handleNavigation(item.path)}
              className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'text-blue-400 bg-blue-500/10' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative">
                <Icon className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                {item.badge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full"
                  />
                )}
              </div>
              <span className={`text-xs mt-1 ${
                isActive ? 'text-blue-400 font-medium' : 'text-slate-400'
              }`}>
                {item.label}
              </span>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}