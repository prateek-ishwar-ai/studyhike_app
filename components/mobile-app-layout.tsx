"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import MobileNavBar from "./mobile-nav-bar"
import { motion } from "framer-motion"
import { StatusBar } from "@capacitor/status-bar"
import { Keyboard } from "@capacitor/keyboard"

interface MobileAppLayoutProps {
  children: React.ReactNode
}

export default function MobileAppLayout({ children }: MobileAppLayoutProps) {
  const { user, profile } = useAuth()
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    // Set status bar style for mobile app
    const setupStatusBar = async () => {
      try {
        await StatusBar.setStyle({ style: "DARK" })
        await StatusBar.setBackgroundColor({ color: "#0F172A" })
      } catch (error) {
        console.log("Status bar setup failed (not in mobile app)", error)
      }
    }

    // Handle keyboard events
    const setupKeyboard = async () => {
      try {
        await Keyboard.addListener('keyboardWillShow', (info) => {
          setKeyboardHeight(info.keyboardHeight)
          setIsKeyboardOpen(true)
        })

        await Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardHeight(0)
          setIsKeyboardOpen(false)
        })
      } catch (error) {
        console.log("Keyboard setup failed (not in mobile app)", error)
      }
    }

    setupStatusBar()
    setupKeyboard()

    // Cleanup
    return () => {
      try {
        Keyboard.removeAllListeners()
      } catch (error) {
        console.log("Keyboard cleanup failed", error)
      }
    }
  }, [])

  // Determine user role
  const userRole = profile?.role || 'student'

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-white">
      {/* Safe area for mobile devices */}
      <div className="pt-safe-top">
        {/* Main content area */}
        <motion.main 
          className={`flex-1 overflow-y-auto ${
            isKeyboardOpen ? 'pb-0' : 'pb-20'
          }`}
          style={{ 
            paddingBottom: isKeyboardOpen ? keyboardHeight : '5rem',
            minHeight: `calc(100vh - ${keyboardHeight}px)`
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.main>

        {/* Bottom Navigation - hide when keyboard is open */}
        {!isKeyboardOpen && (
          <MobileNavBar userRole={userRole} />
        )}
      </div>

      {/* Mobile-specific styles */}
      <style jsx global>{`
        /* Hide scrollbars on mobile */
        ::-webkit-scrollbar {
          display: none;
        }
        
        /* Prevent zoom on input focus */
        input[type="text"],
        input[type="email"],
        input[type="password"],
        input[type="number"],
        input[type="tel"],
        textarea {
          font-size: 16px !important;
        }
        
        /* Safe area support */
        .pt-safe-top {
          padding-top: env(safe-area-inset-top);
        }
        
        .pb-safe-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
        
        /* Prevent overscroll bounce */
        body {
          overscroll-behavior: none;
          -webkit-overflow-scrolling: touch;
        }
        
        /* Mobile-optimized touch targets */
        button {
          min-height: 44px;
          min-width: 44px;
        }
        
        /* Improve tap highlighting */
        * {
          -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
        
        /* Prevent text selection on UI elements */
        .no-select {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        /* Mobile-friendly focus styles */
        input:focus,
        textarea:focus,
        select:focus {
          outline: 2px solid #3B82F6;
          outline-offset: 2px;
        }
        
        /* Optimize for mobile performance */
        * {
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
        }
        
        /* Handle notch devices */
        @supports (padding: max(0px)) {
          .pt-safe-top {
            padding-top: max(env(safe-area-inset-top), 20px);
          }
        }
      `}</style>
    </div>
  )
}