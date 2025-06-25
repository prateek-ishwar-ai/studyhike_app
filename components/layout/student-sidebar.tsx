"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BookOpen,
  Calendar,
  CheckSquare,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Star,
  TrendingUp,
  User,
  Video,
  Clock,
  Settings,
} from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/student/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "My Study Plan",
    href: "/student/study-plan",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    title: "Study Timer",
    href: "/student/study-timer",
    icon: <Clock className="h-5 w-5" />,
  },
  {
    title: "Homework",
    href: "/student/homework",
    icon: <CheckSquare className="h-5 w-5" />,
  },
  {
    title: "Tests",
    href: "/student/tests",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Resources",
    href: "/student/resources",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: "Meeting Requests",
    href: "/student/meeting-requests",
    icon: <Video className="h-5 w-5" />,
  },
  {
    title: "Progress Reports",
    href: "/student/progress",
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    title: "Profile",
    href: "/student/profile",
    icon: <User className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/student/settings",
    icon: <Settings className="h-5 w-5" />,
  },
]

export function StudentSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-[#111420] border-r border-gray-800 h-full">
      <div className="flex items-center h-16 px-6 border-b border-gray-800">
        <Link href="/" className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-yellow-400" />
          <span className="font-bold text-lg text-gray-100">StudyHike</span>
        </Link>
      </div>
      <div className="py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                pathname === item.href 
                  ? "bg-[#252A3D] text-yellow-400 border border-gray-700" 
                  : "text-gray-300 hover:bg-[#1A1D2D] hover:text-gray-100",
              )}
            >
              <span className="mr-3">{pathname === item.href ? 
                <span className="text-yellow-400">{item.icon}</span> : 
                <span className="text-gray-400">{item.icon}</span>
              }</span>
              {item.title}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
