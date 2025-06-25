"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface DashboardCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  className?: string
  children?: React.ReactNode
}

export function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  children
}: DashboardCardProps) {
  return (
    <div className={cn("dashboard-card", className)}>
      <div className="dashboard-card-header">
        <h3 className="dashboard-stat-label">{title}</h3>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="dashboard-card-content">
        <div className="dashboard-stat-number">{value}</div>
        {description && (
          <p className="dashboard-stat-description">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

interface DashboardContentCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}

export function DashboardContentCard({
  title,
  description,
  children,
  className,
  action
}: DashboardContentCardProps) {
  return (
    <div className={cn("dashboard-card", className)}>
      <div className="dashboard-card-header">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="dashboard-card-content">
        {children}
      </div>
    </div>
  )
}