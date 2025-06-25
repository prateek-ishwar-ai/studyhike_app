"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Search, BookOpen, Video, FileImage, Star, Loader } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface Resource {
  id: string
  title: string
  description: string
  subject: string
  file_type: "pdf" | "video" | "image"
  difficulty_level?: string
  file_url: string
  uploaded_by: string
  created_at: string
  mentor_name?: string
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")

  // Fetch resources from Supabase
  useEffect(() => {
    async function fetchResources() {
      try {
        setLoading(true)
        
        if (!supabase) {
          console.error("Supabase client not initialized")
          setLoading(false)
          return
        }

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error("Authentication error:", userError)
          router.push('/auth/login')
          return
        }

        try {
          // Get resources
          const { data, error } = await supabase
            .from('resources')
            .select('*, profiles!resources_uploaded_by_fkey(full_name)')
            .order('created_at', { ascending: false })
          
          if (error) {
            console.error("Error fetching resources:", error)
            toast({
              title: "Error",
              description: "Failed to load resources. Please try again later.",
              variant: "destructive"
            })
          } else if (data) {
            // If data is empty, set empty resources array
            if (data.length === 0) {
              setResources([])
              return
            }
            
            const formattedResources = data.map(resource => ({
              id: resource.id,
              title: resource.title || "Untitled Resource",
              description: resource.description || "No description available",
              subject: resource.subject || "General",
              file_type: resource.file_type || "document",
              difficulty_level: resource.difficulty_level || "medium",
              file_url: resource.file_url || "#",
              uploaded_by: resource.uploaded_by,
              created_at: resource.created_at || new Date().toISOString(),
              mentor_name: resource.profiles?.full_name || "Your Mentor"
            }))
            
            setResources(formattedResources)
          } else {
            // If no data and no error, set empty resources array
            setResources([])
          }
        } catch (innerError) {
          console.error("Error processing resources data:", innerError)
          setResources([])
          toast({
            title: "Error",
            description: "Failed to process resources data. Please try again later.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Error in fetch resources:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchResources()
  }, [router])

  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = selectedSubject === "all" || resource.subject === selectedSubject
    const matchesType = selectedType === "all" || resource.file_type === selectedType
    const matchesDifficulty = selectedDifficulty === "all" || resource.difficulty_level === selectedDifficulty

    return matchesSearch && matchesSubject && matchesType && matchesDifficulty
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-600" />
      case "video":
        return <Video className="h-5 w-5 text-blue-600" />
      case "image":
        return <FileImage className="h-5 w-5 text-green-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const getSubjectColor = (subject: string) => {
    switch (subject) {
      case "Physics":
        return "bg-blue-100 text-blue-800"
      case "Chemistry":
        return "bg-green-100 text-green-800"
      case "Mathematics":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Function to handle resource download
  const handleDownload = async (resource: Resource) => {
    try {
      // Open the file URL in a new tab
      window.open(resource.file_url, '_blank')
    } catch (error) {
      console.error("Error in download:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin mb-4" />
        <p>Loading resources...</p>
      </div>
    )
  }

  // Extract unique subjects, types from real data
  const subjects = Array.from(new Set(resources.map(r => r.subject)))
  const types = Array.from(new Set(resources.map(r => r.file_type)))
  const difficulties = ["easy", "medium", "hard"]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Study Resources</h1>
        <p className="text-gray-600 mt-1">Access curated study materials and resources</p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Find Resources</CardTitle>
          <CardDescription>Search and filter resources by subject, type, and difficulty</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resource Categories */}
      {resources.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-xl font-medium text-gray-500 mb-2">No resources available</p>
            <p className="text-gray-400">Check back later for new study materials</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Resources ({filteredResources.length})</TabsTrigger>
              <TabsTrigger value="pdf">PDFs ({filteredResources.filter((r) => r.file_type === "pdf").length})</TabsTrigger>
              <TabsTrigger value="video">Videos ({filteredResources.filter((r) => r.file_type === "video").length})</TabsTrigger>
              <TabsTrigger value="image">
                Images ({filteredResources.filter((r) => r.file_type === "image").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map((resource) => (
                  <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(resource.file_type)}
                          <CardTitle className="text-lg">{resource.title}</CardTitle>
                        </div>
                      </div>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge className={getSubjectColor(resource.subject)}>{resource.subject}</Badge>
                        <Badge variant="outline">{resource.file_type.toUpperCase()}</Badge>
                        <Badge className={getDifficultyColor(resource.difficulty_level || 'medium')}>{resource.difficulty_level || 'Medium'}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-4">
                        <p>By {resource.mentor_name || "Your Mentor"}</p>
                        <p>Added on {new Date(resource.created_at).toLocaleDateString()}</p>
                      </div>
                      <Button className="w-full" onClick={() => handleDownload(resource)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download Resource
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pdf">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources
                  .filter((r) => r.file_type === "pdf")
                  .map((resource) => (
                    <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-red-600" />
                            <CardTitle className="text-lg">{resource.title}</CardTitle>
                          </div>
                        </div>
                        <CardDescription>{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge className={getSubjectColor(resource.subject)}>{resource.subject}</Badge>
                          <Badge variant="outline">{resource.file_type.toUpperCase()}</Badge>
                          <Badge className={getDifficultyColor(resource.difficulty_level || 'medium')}>{resource.difficulty_level || 'Medium'}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          <p>By {resource.mentor_name || "Your Mentor"}</p>
                          <p>Added on {new Date(resource.created_at).toLocaleDateString()}</p>
                        </div>
                        <Button className="w-full" onClick={() => handleDownload(resource)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="video">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources
                  .filter((r) => r.file_type === "video")
                  .map((resource) => (
                    <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <Video className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-lg">{resource.title}</CardTitle>
                          </div>
                        </div>
                        <CardDescription>{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge className={getSubjectColor(resource.subject)}>{resource.subject}</Badge>
                          <Badge variant="outline">{resource.file_type.toUpperCase()}</Badge>
                          <Badge className={getDifficultyColor(resource.difficulty_level || 'medium')}>{resource.difficulty_level || 'Medium'}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          <p>By {resource.mentor_name || "Your Mentor"}</p>
                          <p>Added on {new Date(resource.created_at).toLocaleDateString()}</p>
                        </div>
                        <Button className="w-full" onClick={() => handleDownload(resource)}>
                          <Download className="mr-2 h-4 w-4" />
                          Watch Video
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="image">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources
                  .filter((r) => r.file_type === "image")
                  .map((resource) => (
                    <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <FileImage className="h-5 w-5 text-green-600" />
                            <CardTitle className="text-lg">{resource.title}</CardTitle>
                          </div>
                        </div>
                        <CardDescription>{resource.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge className={getSubjectColor(resource.subject)}>{resource.subject}</Badge>
                          <Badge variant="outline">{resource.file_type.toUpperCase()}</Badge>
                          <Badge className={getDifficultyColor(resource.difficulty_level || 'medium')}>{resource.difficulty_level || 'Medium'}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          <p>By {resource.mentor_name || "Your Mentor"}</p>
                          <p>Added on {new Date(resource.created_at).toLocaleDateString()}</p>
                        </div>
                        <Button className="w-full" onClick={() => handleDownload(resource)}>
                          <Download className="mr-2 h-4 w-4" />
                          View Image
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}