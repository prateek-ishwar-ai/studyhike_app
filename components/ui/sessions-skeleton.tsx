"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SessionsSkeleton() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-10 bg-gray-100 animate-pulse rounded-md w-48 mb-2"></div>
          <div className="h-5 bg-gray-100 animate-pulse rounded-md w-64"></div>
        </div>
        <div className="h-10 bg-gray-100 animate-pulse rounded-md w-32"></div>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming" disabled>Upcoming</TabsTrigger>
          <TabsTrigger value="past" disabled>Past Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>Your scheduled and pending sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="h-6 bg-gray-100 animate-pulse rounded-md w-48"></div>
                          <div className="h-5 bg-gray-100 animate-pulse rounded-md w-20"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <div className="h-4 w-4 bg-gray-100 animate-pulse rounded-full mr-2"></div>
                            <div className="h-4 bg-gray-100 animate-pulse rounded-md w-40"></div>
                          </div>
                          <div className="flex items-center">
                            <div className="h-4 w-4 bg-gray-100 animate-pulse rounded-full mr-2"></div>
                            <div className="h-4 bg-gray-100 animate-pulse rounded-md w-32"></div>
                          </div>
                          <div className="flex items-center">
                            <div className="h-4 w-4 bg-gray-100 animate-pulse rounded-full mr-2"></div>
                            <div className="h-4 bg-gray-100 animate-pulse rounded-md w-36"></div>
                          </div>
                        </div>
                      </div>
                      <div className="h-8 bg-gray-100 animate-pulse rounded-md w-24"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}