"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Bell, BookOpen, Calendar, CheckCircle, Clock, FileText, Video } from "lucide-react"

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("all")

  // Sample notification data
  const notifications = [
    {
      id: 1,
      title: "New homework assigned",
      description: "Your mentor has assigned you new homework on Physics.",
      time: "2 hours ago",
      type: "homework",
      read: false,
      link: "/student/homework"
    },
    {
      id: 2,
      title: "Homework reviewed",
      description: "Your mentor has reviewed your Mathematics homework.",
      time: "Yesterday",
      type: "homework",
      read: false,
      link: "/student/homework"
    },
    {
      id: 3,
      title: "Meeting scheduled",
      description: "Your mentor has scheduled a meeting for tomorrow at 4 PM.",
      time: "2 days ago",
      type: "meeting",
      read: true,
      link: "/student/meeting-requests"
    },
    {
      id: 4,
      title: "New study resource available",
      description: "Your mentor has shared a new resource for Chemistry.",
      time: "3 days ago",
      type: "resource",
      read: true,
      link: "/student/resources"
    },
    {
      id: 5,
      title: "Test scheduled",
      description: "Your mentor has scheduled a Physics test for next week.",
      time: "5 days ago",
      type: "test",
      read: true,
      link: "/student/tests"
    }
  ]

  const unreadCount = notifications.filter(n => !n.read).length
  const homeworkNotifications = notifications.filter(n => n.type === "homework")
  const meetingNotifications = notifications.filter(n => n.type === "meeting")
  const testNotifications = notifications.filter(n => n.type === "test")
  const resourceNotifications = notifications.filter(n => n.type === "resource")

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "homework":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "meeting":
        return <Video className="h-5 w-5 text-purple-500" />
      case "test":
        return <CheckCircle className="h-5 w-5 text-red-500" />
      case "resource":
        return <BookOpen className="h-5 w-5 text-green-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">Stay updated with your latest activities</p>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All {unreadCount > 0 && <Badge className="ml-2 bg-blue-500">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="homework">Homework</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Notifications</CardTitle>
              <CardDescription>View all your recent notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 border rounded-lg hover:bg-gray-50 cursor-pointer ${!notification.read ? 'border-blue-200 bg-blue-50' : ''}`}
                    onClick={() => window.location.href = notification.link}
                  >
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-lg">{notification.title}</h3>
                          {!notification.read && (
                            <Badge className="bg-blue-500">New</Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mt-1">{notification.description}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{notification.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="homework">
          <Card>
            <CardHeader>
              <CardTitle>Homework Notifications</CardTitle>
              <CardDescription>Updates about your homework assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {homeworkNotifications.length > 0 ? (
                  homeworkNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border rounded-lg hover:bg-gray-50 cursor-pointer ${!notification.read ? 'border-blue-200 bg-blue-50' : ''}`}
                      onClick={() => window.location.href = notification.link}
                    >
                      <div className="flex items-start">
                        <div className="mr-3 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-lg">{notification.title}</h3>
                            {!notification.read && (
                              <Badge className="bg-blue-500">New</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 mt-1">{notification.description}</p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{notification.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No homework notifications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meetings">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Notifications</CardTitle>
              <CardDescription>Updates about your scheduled meetings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {meetingNotifications.length > 0 ? (
                  meetingNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border rounded-lg hover:bg-gray-50 cursor-pointer ${!notification.read ? 'border-blue-200 bg-blue-50' : ''}`}
                      onClick={() => window.location.href = notification.link}
                    >
                      <div className="flex items-start">
                        <div className="mr-3 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-lg">{notification.title}</h3>
                            {!notification.read && (
                              <Badge className="bg-blue-500">New</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 mt-1">{notification.description}</p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{notification.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No meeting notifications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>Test Notifications</CardTitle>
              <CardDescription>Updates about your tests and assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testNotifications.length > 0 ? (
                  testNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border rounded-lg hover:bg-gray-50 cursor-pointer ${!notification.read ? 'border-blue-200 bg-blue-50' : ''}`}
                      onClick={() => window.location.href = notification.link}
                    >
                      <div className="flex items-start">
                        <div className="mr-3 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-lg">{notification.title}</h3>
                            {!notification.read && (
                              <Badge className="bg-blue-500">New</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 mt-1">{notification.description}</p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{notification.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No test notifications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resource Notifications</CardTitle>
              <CardDescription>Updates about new study resources</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {resourceNotifications.length > 0 ? (
                  resourceNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border rounded-lg hover:bg-gray-50 cursor-pointer ${!notification.read ? 'border-blue-200 bg-blue-50' : ''}`}
                      onClick={() => window.location.href = notification.link}
                    >
                      <div className="flex items-start">
                        <div className="mr-3 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-lg">{notification.title}</h3>
                            {!notification.read && (
                              <Badge className="bg-blue-500">New</Badge>
                            )}
                          </div>
                          <p className="text-gray-600 mt-1">{notification.description}</p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{notification.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No resource notifications</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}