"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, UserCheck, BookOpen, Calendar, TrendingUp, Settings, Shield, Database, Mail, Video, BarChart } from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Mentors",
    href: "/admin/mentors",
    icon: <UserCheck className="h-5 w-5" />,
  },
  {
    title: "Assign Students",
    href: "/admin/assign-students",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Meetings",
    href: "/admin/meetings",
    icon: <Video className="h-5 w-5" />,
  },
  {
    title: "Sessions",
    href: "/admin/sessions",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    title: "Homework",
    href: "/admin/homework",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: "Email",
    href: "/admin/email",
    icon: <Mail className="h-5 w-5" />,
  },
  {
    title: "Progress Reports",
    href: "/admin/progress-reports",
    icon: <BarChart className="h-5 w-5" />,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    title: "Database Setup",
    href: "/admin/database-setup",
    icon: <Database className="h-5 w-5" />,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-[#111420] border-r border-gray-800 h-full">
      <div className="flex items-center h-16 px-6 border-b border-gray-800">
        <Link href="/" className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-yellow-400" />
          <span className="font-bold text-lg text-gray-100">Admin Panel</span>
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
