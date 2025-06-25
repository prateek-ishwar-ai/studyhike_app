"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("dashboard-card animate-pulse", className)}>
      <div className="dashboard-card-header">
        <div className="h-4 bg-muted rounded w-1/3"></div>
        <div className="h-4 w-4 bg-muted rounded"></div>
      </div>
      <div className="dashboard-card-content">
        <div className="h-8 bg-muted rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-muted rounded w-2/3"></div>
      </div>
    </div>
  )
}

interface SkeletonContentCardProps {
  className?: string
  rows?: number
}

export function SkeletonContentCard({ className, rows = 3 }: SkeletonContentCardProps) {
  return (
    <div className={cn("dashboard-card animate-pulse", className)}>
      <div className="dashboard-card-header">
        <div>
          <div className="h-5 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </div>
      <div className="dashboard-card-content">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-muted rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}