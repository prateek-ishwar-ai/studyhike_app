"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BookOpen, Menu, X, User, Settings, LogOut, Compass, GraduationCap, BarChart, Zap, Lightbulb } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar({ className }: { className?: string }) {
  const { user, profile, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const getDashboardLink = () => {
    if (!profile) return "/auth/signin"

    switch (profile.role) {
      case "student":
        return "/student/dashboard"
      case "mentor":
        return "/mentor/dashboard"
      case "admin":
        return "/admin/dashboard"
      default:
        return "/auth/signin"
    }
  }

  return (
    <nav className={cn(
      "transition-all duration-300 z-50 font-['Inter']", 
      scrolled ? "bg-[#002B5B]/90 backdrop-blur-md shadow-lg" : "bg-transparent",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-[#FFBB00]" />
              <span className="text-xl font-bold text-white">StudyHike</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-white/80 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/features" className="text-white/80 hover:text-white transition-colors">
              <span className="flex items-center">
                <Compass className="h-4 w-4 mr-1" />
                Features
              </span>
            </Link>
            <Link href="/resources" className="text-white/80 hover:text-white transition-colors">
              <span className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                Resources
              </span>
            </Link>
            <Link href="/testimonials" className="text-white/80 hover:text-white transition-colors">
              <span className="flex items-center">
                <BarChart className="h-4 w-4 mr-1" />
                Testimonials
              </span>
            </Link>

            {!user ? (
              <div className="flex items-center space-x-3">
                <Link href="/auth/signin">
                  <Button variant="ghost" className="text-white hover:bg-white/10 border-white/20">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="bg-[#FFBB00] hover:bg-[#E5A800] text-[#002B5B] font-medium">
                    Sign Up
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href={getDashboardLink()} className="text-white/80 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8 border border-[#FFBB00]/50">
                        <AvatarFallback className="bg-[#FFBB00]/20 text-white">{profile?.full_name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-[#1E293B] border-[#334155]" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-white">{profile?.full_name}</p>
                        <p className="w-[200px] truncate text-sm text-white/60">{profile?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuItem asChild className="hover:bg-[#0F172A] focus:bg-[#0F172A]">
                      <Link href="/profile" className="cursor-pointer text-white/80">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="hover:bg-[#0F172A] focus:bg-[#0F172A]">
                      <Link href="/settings" className="cursor-pointer text-white/80">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-white/80 hover:bg-[#0F172A] focus:bg-[#0F172A]">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-[#1E293B] shadow-lg">
            <Link href="/" className="block px-3 py-2 text-white/80 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/features" className="block px-3 py-2 text-white/80 hover:text-white transition-colors">
              <span className="flex items-center">
                <Compass className="h-4 w-4 mr-2" />
                Features
              </span>
            </Link>
            <Link href="/resources" className="block px-3 py-2 text-white/80 hover:text-white transition-colors">
              <span className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2" />
                Resources
              </span>
            </Link>
            <Link href="/testimonials" className="block px-3 py-2 text-white/80 hover:text-white transition-colors">
              <span className="flex items-center">
                <BarChart className="h-4 w-4 mr-2" />
                Testimonials
              </span>
            </Link>

            {!user ? (
              <div className="flex flex-col space-y-2 px-3 py-2">
                <Link href="/auth/signin" className="block">
                  <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">Login</Button>
                </Link>
                <Link href="/auth/signup" className="block">
                  <Button className="w-full bg-[#FFBB00] text-[#002B5B] hover:bg-[#E5A800]">Sign Up</Button>
                </Link>
              </div>
            ) : (
              <>
                <Link href={getDashboardLink()} className="block px-3 py-2 text-white/80 hover:text-white">
                  Dashboard
                </Link>
                <Link href="/profile" className="block px-3 py-2 text-white/80 hover:text-white">
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 text-white/80 hover:text-white"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
