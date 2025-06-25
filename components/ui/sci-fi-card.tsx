import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "./card"

const SciFiCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'blue' | 'green' | 'purple' | 'yellow' | 'default' }
>(({ className, variant = 'default', ...props }, ref) => {
  const variantStyles = {
    blue: "bg-[#1E293B]/80 border-[#60A5FA]/30 text-[#F8FAFC] shadow-lg hover:border-[#60A5FA]/50 transition-all duration-300",
    green: "bg-[#1E293B]/80 border-[#10B981]/30 text-[#F8FAFC] shadow-lg hover:border-[#10B981]/50 transition-all duration-300",
    purple: "bg-[#1E293B]/80 border-[#A855F7]/30 text-[#F8FAFC] shadow-lg hover:border-[#A855F7]/50 transition-all duration-300",
    yellow: "bg-[#1E293B]/80 border-[#FACC15]/30 text-[#F8FAFC] shadow-lg hover:border-[#FACC15]/50 transition-all duration-300",
    default: "bg-[#1E293B]/80 border-[#334155] text-[#F8FAFC] shadow-lg hover:border-[#475569] transition-all duration-300"
  }

  return (
    <Card
      ref={ref}
      className={cn(variantStyles[variant], className)}
      {...props}
    />
  )
})
SciFiCard.displayName = "SciFiCard"

const SciFiCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardHeader
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
SciFiCardHeader.displayName = "SciFiCardHeader"

const SciFiCardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'blue' | 'green' | 'purple' | 'yellow' | 'default' }
>(({ className, variant = 'default', ...props }, ref) => {
  const variantStyles = {
    blue: "text-[#60A5FA]",
    green: "text-[#10B981]",
    purple: "text-[#A855F7]",
    yellow: "text-[#FACC15]",
    default: "text-[#F8FAFC]"
  }

  return (
    <CardTitle
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
})
SciFiCardTitle.displayName = "SciFiCardTitle"

const SciFiCardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardDescription
    ref={ref}
    className={cn("text-sm text-[#CBD5E1]", className)}
    {...props}
  />
))
SciFiCardDescription.displayName = "SciFiCardDescription"

const SciFiCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardContent ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
SciFiCardContent.displayName = "SciFiCardContent"

const SciFiCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <CardFooter
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
SciFiCardFooter.displayName = "SciFiCardFooter"

export { 
  SciFiCard, 
  SciFiCardHeader, 
  SciFiCardFooter, 
  SciFiCardTitle, 
  SciFiCardDescription, 
  SciFiCardContent 
}