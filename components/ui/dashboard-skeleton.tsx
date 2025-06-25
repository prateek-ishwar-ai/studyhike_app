"use client"

import React from "react"

interface DashboardSkeletonProps {
  type: "admin" | "mentor" | "student"
}

export function DashboardSkeleton({ type }: DashboardSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-10 bg-gray-100 animate-pulse rounded-md w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-100 animate-pulse rounded-md w-1/2"></div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-md"></div>
        ))}
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 border rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <div className="h-5 bg-gray-100 animate-pulse rounded-md w-1/2"></div>
              <div className="h-4 w-4 bg-gray-100 animate-pulse rounded-full"></div>
            </div>
            <div className="h-8 bg-gray-100 animate-pulse rounded-md w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-100 animate-pulse rounded-md w-2/3"></div>
            {(type === "admin" || type === "student") && (
              <div className="h-2 bg-gray-100 animate-pulse rounded-md w-full mt-4"></div>
            )}
          </div>
        ))}
      </div>

      {/* Content Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="border rounded-lg p-6">
            <div className="h-6 bg-gray-100 animate-pulse rounded-md w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-100 animate-pulse rounded-md w-1/2 mb-6"></div>
            
            <div className="space-y-4">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-2 w-2/3">
                    <div className="h-4 bg-gray-100 animate-pulse rounded-md w-3/4"></div>
                    <div className="h-3 bg-gray-100 animate-pulse rounded-md w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-100 animate-pulse rounded-md w-20"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Additional content for admin */}
      {type === "admin" && (
        <div className="border rounded-lg p-6 mt-6">
          <div className="h-6 bg-gray-100 animate-pulse rounded-md w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="h-5 bg-gray-100 animate-pulse rounded-md w-1/2 mb-3"></div>
                <div className="h-4 bg-gray-100 animate-pulse rounded-md w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-100 animate-pulse rounded-md w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}