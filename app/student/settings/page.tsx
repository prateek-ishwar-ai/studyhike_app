"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Zap, Monitor, Moon, Sun, Eye } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [performanceMode, setPerformanceMode] = useState("normal")
  const [reducedAnimations, setReducedAnimations] = useState(false)
  const [fastLoading, setFastLoading] = useState(false)
  
  // Wait for component to mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    
    // Load saved settings
    if (typeof window !== 'undefined') {
      const savedPerformanceMode = localStorage.getItem('performance_mode') || 'normal'
      const savedReducedAnimations = localStorage.getItem('reduced_animations') === 'true'
      const savedFastLoading = localStorage.getItem('fast_loading') === 'true'
      
      setPerformanceMode(savedPerformanceMode)
      setReducedAnimations(savedReducedAnimations)
      setFastLoading(savedFastLoading)
    }
  }, [])
  
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
  
  if (!mounted) {
    return null
  }
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="appearance">
        <TabsList className="mb-4">
          <TabsTrigger value="appearance">
            <Monitor className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Zap className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
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
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Settings</CardTitle>
              <CardDescription>
                Optimize the application for your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Performance Mode</Label>
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
                      <Settings className="h-4 w-4 mr-2" />
                      Custom
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  High Performance mode disables animations and transitions for faster loading.
                </p>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-medium">Advanced Settings</h3>
                
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}