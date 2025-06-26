import React from "react"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "JEE Mentor - Your JEE Journey Starts With the Right Guidance",
  description:
    "Get personalized study plans, expert mentorship, and track your progress with our comprehensive JEE preparation platform.",
  generator: 'v0.dev'
}

export default function StaticLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>JEE Mentor - Your JEE Journey Starts With the Right Guidance</title>
        <meta 
          name="description" 
          content="Get personalized study plans, expert mentorship, and track your progress with our comprehensive JEE preparation platform." 
        />
        <meta name="generator" content="v0.dev" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}