import React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { ClientLayoutWrapper } from "@/components/ui/client-layout-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "JEE Mentor - Your JEE Journey Starts With the Right Guidance",
  description:
    "Get personalized study plans, expert mentorship, and track your progress with our comprehensive JEE preparation platform.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ClientLayoutWrapper>
              {children}
            </ClientLayoutWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
