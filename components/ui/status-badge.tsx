"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "completed" | "pending" | "urgent" | "missed"
  variant?: "default" | "dot" | "outline"
  children?: React.ReactNode
  className?: string
}

export function StatusBadge({ 
  status, 
  variant = "default", 
  children, 
  className 
}: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case "completed":
        return variant === "dot" 
          ? "status-dot-completed" 
          : "status-completed"
      case "pending":
        return variant === "dot" 
          ? "status-dot-pending" 
          : "status-pending"
      case "urgent":
      case "missed":
        return variant === "dot" 
          ? "status-dot-urgent" 
          : "status-urgent"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  if (variant === "dot") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className={getStatusStyles()} />
        {children && <span className="text-sm">{children}</span>}
      </div>
    )
  }

  if (variant === "outline") {
    return (
      <div className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium",
        getStatusStyles(),
        className
      )}>
        <div className={cn(
          "w-1.5 h-1.5 rounded-full",
          status === "completed" && "bg-green-500",
          status === "pending" && "bg-yellow-500",
          (status === "urgent" || status === "missed") && "bg-red-500"
        )} />
        {children}
      </div>
    )
  }

  return (
    <div className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      getStatusStyles(),
      className
    )}>
      {children}
    </div>
  )
}