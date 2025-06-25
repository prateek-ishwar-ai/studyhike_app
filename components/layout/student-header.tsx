"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, LogOut, Settings, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface StudentHeaderProps {
  studentName: string
}

export function StudentHeader({ studentName }: StudentHeaderProps) {
  const router = useRouter()
  const [notifications] = useState(3)
  const [showNotifications, setShowNotifications] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)

  const handleSignOut = () => {
    router.push("/auth/login")
  }
  
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications)
  }
  
  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [notificationRef])

  return (
    <header className="bg-[#111420] border-b border-gray-800 h-16 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Student Dashboard</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative" ref={notificationRef}>
          <Button 
            variant="outline" 
            size="icon" 
            className="relative bg-[#1A1D2D] border-gray-700 hover:bg-[#252A3D] hover:text-yellow-400"
            onClick={toggleNotifications}
          >
            <Bell className="h-5 w-5 text-gray-300" />
            {notifications > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 bg-yellow-400 rounded-full text-[10px] flex items-center justify-center text-[#0C0E19]">
                {notifications}
              </span>
            )}
          </Button>
          
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#1A1D2D] rounded-md shadow-lg z-10 border border-gray-700">
              <div className="p-3 border-b border-gray-700">
                <h3 className="font-medium text-gray-200">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-700 hover:bg-[#252A3D] cursor-pointer" onClick={() => router.push('/student/homework')}>
                  <p className="text-sm font-medium text-gray-200">New homework assigned</p>
                  <p className="text-xs text-gray-400 mt-1">Your mentor has assigned you new homework on Physics.</p>
                  <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                </div>
                <div className="p-3 border-b border-gray-700 hover:bg-[#252A3D] cursor-pointer" onClick={() => router.push('/student/homework')}>
                  <p className="text-sm font-medium text-gray-200">Homework reviewed</p>
                  <p className="text-xs text-gray-400 mt-1">Your mentor has reviewed your Mathematics homework.</p>
                  <p className="text-xs text-gray-500 mt-1">Yesterday</p>
                </div>
                <div className="p-3 hover:bg-[#252A3D] cursor-pointer" onClick={() => router.push('/student/meeting-requests')}>
                  <p className="text-sm font-medium text-gray-200">Meeting scheduled</p>
                  <p className="text-xs text-gray-400 mt-1">Your mentor has scheduled a meeting for tomorrow at 4 PM.</p>
                  <p className="text-xs text-gray-500 mt-1">2 days ago</p>
                </div>
              </div>
              <div className="p-2 text-center border-t border-gray-700">
                <button 
                  className="text-sm text-yellow-400 hover:text-yellow-300"
                  onClick={() => {
                    setShowNotifications(false)
                    router.push('/student/notifications')
                  }}
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-[#252A3D]">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-yellow-400 text-[#0C0E19]">{studentName.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-[#1A1D2D] border border-gray-700 text-gray-200" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-gray-200">{studentName}</p>
                <p className="w-[200px] truncate text-sm text-gray-400">student@example.com</p>
              </div>
            </div>
            <DropdownMenuItem asChild className="hover:bg-[#252A3D] focus:bg-[#252A3D] text-gray-200">
              <Link href="/student/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="hover:bg-[#252A3D] focus:bg-[#252A3D] text-gray-200">
              <Link href="/student/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer hover:bg-[#252A3D] focus:bg-[#252A3D] text-gray-200">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
