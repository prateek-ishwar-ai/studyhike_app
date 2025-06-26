"use client"

import React, { useState, useEffect } from "react"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { AdminHeader } from "@/components/layout/admin-header"
import { DashboardLoader } from "@/components/ui/dashboard-loader"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = useAuth()
  const userName = profile?.full_name || "Admin"
  
  return (
    <DashboardLoader portalType="admin" userName={userName}>
      <div className="flex h-screen bg-[#0C0E19]">
        {/* Sidebar loads independently */}
        <AnimatePresence>
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AdminSidebar />
          </motion.div>
        </AnimatePresence>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <AdminHeader adminName={userName} />
          
          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-6 bg-[#0C0E19] text-white">
            {children}
          </main>
        </div>
      </div>
    </DashboardLoader>
  )
}
