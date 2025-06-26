"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, Zap, Monitor, Moon, Sun, Eye, Settings as SettingsIcon } from "lucide-react"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const { user, profile, updateProfile } = useAuth()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  
  // Profile settings
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [sessionReminders, setSessionReminders] = useState(true)
  const [homeworkReminders, setHomeworkReminders] = useState(true)
  
  // Performance settings
  const [performanceMode, setPerformanceMode] = useState("normal")
  const [reducedAnimations, setReducedAnimations] = useState(false)
  const [fastLoading, setFastLoading] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    
    if (profile) {
      setFullName(profile.full_name || "")
      setEmail(profile.email || "")
      setPhone(profile.phone || "")
      
      // Load performance settings
      if (typeof window !== 'undefined') {
        const savedPerformanceMode = localStorage.getItem('performance_mode') || 'normal'
        const savedReducedAnimations = localStorage.getItem('reduced_animations') === 'true'
        const savedFastLoading = localStorage.getItem('fast_loading') === 'true'
        
        setPerformanceMode(savedPerformanceMode)
        setReducedAnimations(savedReducedAnimations)
        setFastLoading(savedFastLoading)
      }
      
      // Check if we're in demo mode
      const isDemoMode = window.localStorage.getItem('demo_mentor_mode') === 'true' || !supabase;
      
      if (isDemoMode) {
        console.log("Using demo data for settings page");
        // Set default notification settings for demo
        setEmailNotifications(true)
        setSmsNotifications(false)
        setSessionReminders(true)
        setHomeworkReminders(true)
        return;
      }
      
      // Fetch notification settings from Supabase
      async function fetchNotificationSettings() {
        try {
          if (!supabase || !user) return
          
          const { data, error } = await supabase
            .from('notification_settings')
            .select('*')
            .eq('user_id', user.id)
            .single()
            
          if (error) {
            console.error("Error fetching notification settings:", error)
            return
          }
          
          if (data) {
            setEmailNotifications(data.email_notifications)
            setSmsNotifications(data.sms_notifications)
            setSessionReminders(data.session_reminders)
            setHomeworkReminders(data.homework_reminders)
          }
        } catch (error) {
          console.error("Error in fetchNotificationSettings:", error)
        }
      }
      
      fetchNotificationSettings()
    }
  }, [profile, user])
  
  const handleProfileUpdate = async () => {
    try {
      setLoading(true)
      setError(null)
      
      await updateProfile({
        full_name: fullName,
        phone,
      })
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }
  
  const handleNotificationUpdate = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!supabase || !user) {
        throw new Error("Not authenticated")
      }
      
      // Check if settings exist
      const { data: existingSettings } = await supabase
        .from('notification_settings')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (existingSettings) {
        // Update existing settings
        await supabase
          .from('notification_settings')
          .update({
            email_notifications: emailNotifications,
            sms_notifications: smsNotifications,
            session_reminders: sessionReminders,
            homework_reminders: homeworkReminders,
          })
          .eq('user_id', user.id)
      } else {
        // Insert new settings
        await supabase
          .from('notification_settings')
          .insert({
            user_id: user.id,
            email_notifications: emailNotifications,
            sms_notifications: smsNotifications,
            session_reminders: sessionReminders,
            homework_reminders: homeworkReminders,
          })
      }
      
      toast({
        title: "Notification settings saved",
        description: "Your notification preferences have been updated.",
      })
    } catch (error) {
      console.error("Error updating notification settings:", error)
      setError("Failed to update notification settings")
    } finally {
      setLoading(false)
    }
  }
  
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading profile information...</p>
      </div>
    )
  }
  
  // Handle performance mode change
  const handlePerformanceModeChange = (mode: string) => {
    setPerformanceMode(mode)
    localStorage.setItem('performance_mode', mode)
    
    // Apply settings based on mode
    if (mode === 'high') {
      setReducedAnimations(true)
      setFastLoading(true)
      localStorage.setItem('reduced_animations', 'true')
      localStorage.setItem('fast_loading', 'true')
    } else if (mode === 'normal') {
      setReducedAnimations(false)
      setFastLoading(false)
      localStorage.setItem('reduced_animations', 'false')
      localStorage.setItem('fast_loading', 'false')
    }
    
    toast({
      title: "Settings updated",
      description: `Performance mode set to ${mode}. Changes will take effect on the next page load.`,
    })
  }
  
  // Handle individual setting changes
  const handleReducedAnimationsChange = (checked: boolean) => {
    setReducedAnimations(checked)
    localStorage.setItem('reduced_animations', checked.toString())
    
    // Update performance mode to custom if changing individual settings
    if (performanceMode !== 'custom') {
      setPerformanceMode('custom')
      localStorage.setItem('performance_mode', 'custom')
    }
  }
  
  const handleFastLoadingChange = (checked: boolean) => {
    setFastLoading(checked)
    localStorage.setItem('fast_loading', checked.toString())
    
    // Update performance mode to custom if changing individual settings
    if (performanceMode !== 'custom') {
      setPerformanceMode('custom')
      localStorage.setItem('performance_mode', 'custom')
    }
  }
  
  if (!profile || !mounted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading profile information...</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <AlertCircle className="h-5 w-5 inline mr-2" />
          {error}
        </div>
      )}
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    Email cannot be changed. Contact support for assistance.
                  </p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              
              <Button onClick={handleProfileUpdate} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications" className="block">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotifications" className="block">SMS Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via text message</p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={smsNotifications}
                    onCheckedChange={setSmsNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sessionReminders" className="block">Session Reminders</Label>
                    <p className="text-sm text-gray-500">Receive reminders about upcoming sessions</p>
                  </div>
                  <Switch
                    id="sessionReminders"
                    checked={sessionReminders}
                    onCheckedChange={setSessionReminders}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="homeworkReminders" className="block">Homework Reminders</Label>
                    <p className="text-sm text-gray-500">Receive reminders about pending homework reviews</p>
                  </div>
                  <Switch
                    id="homeworkReminders"
                    checked={homeworkReminders}
                    onCheckedChange={setHomeworkReminders}
                  />
                </div>
              </div>
              
              <Button onClick={handleNotificationUpdate} disabled={loading}>
                {loading ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appearance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize how the application looks and performs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="block mb-2">Theme</Label>
                  <div className="flex space-x-2">
                    <Button 
                      variant={theme === 'light' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </Button>
                    <Button 
                      variant={theme === 'dark' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </Button>
                    <Button 
                      variant={theme === 'system' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setTheme('system')}
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      System
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Label className="block mb-2">Performance Mode</Label>
                  <div className="flex space-x-2">
                    <Button 
                      variant={performanceMode === 'normal' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handlePerformanceModeChange('normal')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Normal
                    </Button>
                    <Button 
                      variant={performanceMode === 'high' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => handlePerformanceModeChange('high')}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      High Performance
                    </Button>
                    {performanceMode === 'custom' && (
                      <Button 
                        variant="default" 
                        size="sm"
                      >
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        Custom
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    High Performance mode disables animations and transitions for faster loading.
                  </p>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-medium">Advanced Performance Settings</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reduced-animations">Reduced Animations</Label>
                      <p className="text-sm text-gray-500">
                        Disable page transitions and animations
                      </p>
                    </div>
                    <Switch
                      id="reduced-animations"
                      checked={reducedAnimations}
                      onCheckedChange={handleReducedAnimationsChange}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="fast-loading">Fast Loading</Label>
                      <p className="text-sm text-gray-500">
                        Skip loading animations for faster page loads
                      </p>
                    </div>
                    <Switch
                      id="fast-loading"
                      checked={fastLoading}
                      onCheckedChange={handleFastLoadingChange}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}