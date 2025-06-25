"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, LogOut, Settings, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface MentorHeaderProps {
  mentorName: string
}

export function MentorHeader({ mentorName }: MentorHeaderProps) {
  const router = useRouter()
  const [notifications] = useState(4)

  const handleSignOut = () => {
    router.push("/auth/signin")
  }

  return (
    <header className="bg-[#111420] border-b border-gray-800 h-16 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-100">Mentor Dashboard</h1>
      </div>
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="icon" 
          className="relative bg-[#1A1D2D] border-gray-700 hover:bg-[#252A3D] hover:text-yellow-400"
        >
          <Bell className="h-5 w-5 text-gray-300" />
          {notifications > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 bg-yellow-400 rounded-full text-[10px] flex items-center justify-center text-[#0C0E19]">
              {notifications}
            </span>
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-[#252A3D]">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-yellow-400 text-[#0C0E19]">{mentorName.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-[#1A1D2D] border border-gray-700 text-gray-200" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-gray-200">{mentorName}</p>
                <p className="w-[200px] truncate text-sm text-gray-400">mentor@demo.com</p>
              </div>
            </div>
            <DropdownMenuItem asChild className="hover:bg-[#252A3D] focus:bg-[#252A3D] text-gray-200">
              <Link href="/mentor/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="hover:bg-[#252A3D] focus:bg-[#252A3D] text-gray-200">
              <Link href="/mentor/settings" className="cursor-pointer">
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
