"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, Search, UserCheck, Plus, Mail, Phone, Users } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { AssignStudentsDialog } from "./assign-students-dialog"

interface Mentor {
  id: string
  full_name: string
  email: string
  phone?: string
  subject_specialization: string
  experience_years: number
  status: string
  created_at: string
  current_students?: number
  rating?: number
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAssignStudentsDialogOpen, setIsAssignStudentsDialogOpen] = useState(false)
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)
  const [newMentor, setNewMentor] = useState({
    full_name: "",
    email: "",
    phone: "",
    subject_specialization: "Physics",
    experience_years: 1,
  })

  useEffect(() => {
    fetchMentors()
  }, [])

  const fetchMentors = async () => {
    if (!supabase) {
      setLoading(false)
      toast({
        title: "Error",
        description: "Database connection not available",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      console.log("Fetching mentors...")
      
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          mentors(current_students, rating)
        `)
        .eq("role", "mentor")
        .order("created_at", { ascending: false })

      if (error) throw error

      const formattedData =
        data?.map((mentor) => ({
          id: mentor.id,
          full_name: mentor.full_name,
          email: mentor.email,
          phone: mentor.phone,
          subject_specialization: mentor.subject_specialization,
          experience_years: mentor.experience_years,
          status: mentor.status,
          created_at: mentor.created_at,
          current_students: mentor.mentors?.[0]?.current_students || 0,
          rating: mentor.mentors?.[0]?.rating || 0,
        })) || []

      console.log(`Found ${formattedData.length} mentors`)
      setMentors(formattedData)
    } catch (error) {
      console.error("Error fetching mentors:", error)
      toast({
        title: "Error",
        description: "Failed to load mentors. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddMentor = async () => {
    if (!supabase || !newMentor.full_name || !newMentor.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      // Generate a UUID for the new mentor
      const mentorId = crypto.randomUUID()

      // Insert into profiles table
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: mentorId,
          full_name: newMentor.full_name,
          email: newMentor.email,
          phone: newMentor.phone,
          role: "mentor",
          subject_specialization: newMentor.subject_specialization,
          experience_years: newMentor.experience_years,
          status: "active",
        },
      ])

      if (profileError) throw profileError

      // Insert into mentors table
      const { error: mentorError } = await supabase.from("mentors").insert([
        {
          id: mentorId,
          max_students: 50,
          current_students: 0,
          rating: 0.0,
        },
      ])

      if (mentorError) throw mentorError

      await fetchMentors()
      setNewMentor({
        full_name: "",
        email: "",
        phone: "",
        subject_specialization: "Physics",
        experience_years: 1,
      })
      setIsDialogOpen(false)
      
      toast({
        title: "Success",
        description: "Mentor added successfully!"
      })
    } catch (error) {
      console.error("Error adding mentor:", error)
      toast({
        title: "Error",
        description: `Failed to add mentor: ${error.message}`,
        variant: "destructive"
      })
    }
  }

  const filteredMentors = mentors.filter(
    (mentor) =>
      mentor.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.subject_specialization?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  const getStatusBadge = (status: string) => {
    return <Badge variant={status === "active" ? "default" : "secondary"}>{status}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading mentors...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mentor Management</h1>
          <p className="text-gray-600 mt-1">Manage platform mentors and instructors</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Mentor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Mentor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={newMentor.full_name}
                  onChange={(e) => setNewMentor({ ...newMentor, full_name: e.target.value })}
                  placeholder="Enter mentor's full name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newMentor.email}
                  onChange={(e) => setNewMentor({ ...newMentor, email: e.target.value })}
                  placeholder="mentor@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={newMentor.phone}
                  onChange={(e) => setNewMentor({ ...newMentor, phone: e.target.value })}
                  placeholder="+91 9876543210"
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject Specialization *</Label>
                <Select
                  value={newMentor.subject_specialization}
                  onValueChange={(value) => setNewMentor({ ...newMentor, subject_specialization: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Biology">Biology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="experience">Experience (Years) *</Label>
                <Input
                  id="experience"
                  type="number"
                  value={newMentor.experience_years}
                  onChange={(e) => setNewMentor({ ...newMentor, experience_years: Number(e.target.value) })}
                  min="1"
                  max="50"
                />
              </div>
              <Button className="w-full" onClick={handleAddMentor}>
                Add Mentor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mentors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mentors.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Mentors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mentors.filter((m) => m.status === "active").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Physics Mentors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mentors.filter((m) => m.subject_specialization === "Physics").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chemistry Mentors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mentors.filter((m) => m.subject_specialization === "Chemistry").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Mentors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search mentors by name, email, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mentors Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Mentors</CardTitle>
          <CardDescription>Manage mentor accounts and assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMentors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Assign</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMentors.map((mentor) => (
                  <TableRow key={mentor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{mentor.full_name}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {mentor.email}
                        </div>
                        {mentor.phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {mentor.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSubjectColor(mentor.subject_specialization)}>
                        {mentor.subject_specialization}
                      </Badge>
                    </TableCell>
                    <TableCell>{mentor.experience_years} years</TableCell>
                    <TableCell>{mentor.current_students || 0}</TableCell>
                    <TableCell>{mentor.rating ? `${mentor.rating}/5` : "No rating"}</TableCell>
                    <TableCell>{getStatusBadge(mentor.status)}</TableCell>
                    <TableCell>{new Date(mentor.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedMentor(mentor);
                          setIsAssignStudentsDialogOpen(true);
                        }}
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {mentor.current_students > 0 ? `${mentor.current_students} Students` : "Assign Students"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit Mentor</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedMentor(mentor);
                            setIsAssignStudentsDialogOpen(true);
                          }}>
                            <Users className="h-4 w-4 mr-2" />
                            Assign Students
                          </DropdownMenuItem>
                          <DropdownMenuItem>View Performance</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {supabase ? "No mentors found" : "Supabase not connected - Running in demo mode"}
              </p>
              {!supabase && <p className="text-sm text-gray-500 mt-1">Connect Supabase to see real mentor data</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Students Dialog */}
      <AssignStudentsDialog
        isOpen={isAssignStudentsDialogOpen}
        onClose={() => setIsAssignStudentsDialogOpen(false)}
        mentor={selectedMentor}
        onAssignComplete={() => {
          fetchMentors();
          toast({
            title: "Success",
            description: "Student assignments updated successfully",
          });
        }}
      />
    </div>
  )
}
