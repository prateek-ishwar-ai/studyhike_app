"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface SubscriptionCardProps {
  plan: "free" | "pro" | "premium"
  expiresAt: Date | null
  meetingsUsed: number
  onRequestUsed: number
  daysRemaining: number
  className?: string
}

export function SubscriptionCard({
  plan,
  expiresAt,
  meetingsUsed,
  onRequestUsed,
  daysRemaining,
  className = ""
}: SubscriptionCardProps) {
  // Get background color based on plan
  const getBgColor = () => {
    switch (plan) {
      case "premium":
        return "bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/20"
      case "pro":
        return "bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/20"
      default:
        return "bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-500/20"
    }
  }
  
  // Get icon color based on plan
  const getIconColor = () => {
    switch (plan) {
      case "premium":
        return "text-purple-400"
      case "pro":
        return "text-blue-400"
      default:
        return "text-gray-400"
    }
  }
  
  // Format plan name
  const getPlanName = () => {
    return plan === "free" 
      ? "Free Plan" 
      : `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`
  }
  
  // Get expiration text
  const getExpirationText = () => {
    if (!expiresAt || plan === "free") return null
    
    const isExpired = new Date() > expiresAt
    
    if (isExpired) {
      return <span className="text-red-400">Expired</span>
    }
    
    return (
      <span className={daysRemaining < 5 ? "text-red-400" : "text-white"}>
        {daysRemaining} days
      </span>
    )
  }
  
  return (
    <Card className={`${getBgColor()} hover:border-opacity-40 transition-all ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center">
          <Crown className={`h-5 w-5 mr-2 ${getIconColor()}`} />
          <CardTitle className="text-lg font-bold">{getPlanName()}</CardTitle>
        </div>
        {plan !== "free" && (
          <Badge variant={plan === "premium" ? "destructive" : "secondary"} className="text-xs">
            {plan === "premium" ? "Premium" : "Pro"}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {plan !== "free" && expiresAt && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Expires in:</span>
              {getExpirationText()}
            </div>
          )}
          
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Meetings:</span>
            <span>{meetingsUsed}/8</span>
          </div>
          
          {plan === "premium" && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">On-request:</span>
              <span>{onRequestUsed}/8</span>
            </div>
          )}
          
          <div className="mt-4">
            <Link href="/pricing">
              <Button 
                variant={plan === "free" ? "default" : "outline"} 
                size="sm" 
                className="w-full"
              >
                {plan === "free" ? "Upgrade Plan" : "Manage Subscription"}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}