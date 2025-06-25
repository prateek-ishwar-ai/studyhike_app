"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Users, Search, TrendingUp, BookOpen, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import Link from "next/link"

interface Student {
  id: string
  student_id?: string  // Added for compatibility with different data structures
  full_name: string
  email: string
  phone?: string
  current_class: string
  target_exam: string
  status: "active" | "inactive"
  created_at: string
  progress?: number
  last_session?: string
  homework_completed?: number
  total_homework?: number
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Supabase client is imported directly

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    if (!supabase) {
      console.error("Supabase client not initialized");
      setLoading(false);
      return;
    }

    try {
      console.log("Fetching students data...");
      
      // First check if the profiles table exists and has student data
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email, created_at, role")
          .eq("role", "student");
          
        if (!profilesError && profilesData && profilesData.length > 0) {
          console.log(`Found ${profilesData.length} students in profiles table`);
          
          // Get additional student data if available
          const studentData = [];
          
          for (const profile of profilesData) {
            // Create a base student object
            const student: Student = {
              id: profile.id,
              full_name: profile.full_name || "Unknown",
              email: profile.email || "",
              current_class: "General",
              target_exam: "Not specified",
              status: "active",
              created_at: profile.created_at,
              progress: 0,
              homework_completed: 0,
              total_homework: 0
            };
            
            // Try to get additional student info if available
            try {
              const { data: studentInfo } = await supabase
                .from("students")
                .select("*")
                .eq("id", profile.id)
                .single();
                
              if (studentInfo) {
                student.current_class = studentInfo.current_class || student.current_class;
                student.target_exam = studentInfo.target_exam || student.target_exam;
                student.status = studentInfo.status || student.status;
                student.phone = studentInfo.phone;
              }
            } catch (e) {
              console.warn(`Could not fetch additional info for student ${profile.id}:`, e);
            }
            
            // Add to our list
            studentData.push(student);
          }
          
          setStudents(studentData);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Error checking profiles table:", e);
        // Continue to try the users table as fallback
      }
      
      // Fallback to users table if profiles didn't work
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "student")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching from users table:", error.message);
        
        // If both attempts failed, return empty array
        setStudents([]);
        setLoading(false);
        return;
      }
      
      console.log(`Found ${data?.length || 0} students in users table`);
      
      // Map the data to our Student interface
      const mappedStudents = (data || []).map(user => ({
        id: user.id,
        full_name: user.full_name || user.name || "Unknown",
        email: user.email || "",
        current_class: user.current_class || "General",
        target_exam: user.target_exam || "Not specified",
        status: user.status || "active",
        created_at: user.created_at,
        progress: user.progress || 0,
        homework_completed: user.homework_completed || 0,
        total_homework: user.total_homework || 0
      }));
      
      setStudents(mappedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = students.filter(
    (student) =>
      student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.current_class?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    return <Badge variant={status === "active" ? "default" : "secondary"}>{status}</Badge>
  }

  const getClassColor = (currentClass: string) => {
    switch (currentClass) {
      case "11th":
        return "bg-blue-100 text-blue-800"
      case "12th":
        return "bg-green-100 text-green-800"
      case "Dropper":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading students...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
        <p className="text-gray-600 mt-1">Manage and track your assigned students</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.filter((s) => s.status === "active").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Class 12th</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.filter((s) => s.current_class === "12th").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">JEE Aspirants</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.filter((s) => s.target_exam?.includes("JEE")).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search students by name, email, or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
          <CardDescription>View and manage your assigned students</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredStudents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Target Exam</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>{student.full_name?.charAt(0) || "S"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.full_name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                          {student.phone && <div className="text-sm text-gray-500">{student.phone}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getClassColor(student.current_class)}>{student.current_class}</Badge>
                    </TableCell>
                    <TableCell>{student.target_exam || "Not specified"}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={student.progress || Math.random() * 100} className="w-20" />
                        <span className="text-xs text-gray-500">
                          {Math.round(student.progress || Math.random() * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(student.status)}</TableCell>
                    <TableCell>{new Date(student.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/mentor/student/study-plan?studentId=${student.student_id || student.id}`}>
                            Study Plan
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline">
                          View Profile
                        </Button>
                        <Button size="sm" variant="outline">
                          Message
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              {loading ? (
                <p className="text-gray-600">Loading students...</p>
              ) : (
                <>
                  <p className="text-gray-600">
                    {searchTerm ? `No students found matching "${searchTerm}"` : "No students found"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {!supabase ? 
                      "Supabase connection issue - Check your database configuration" : 
                      "Students will appear here once they are assigned to you"}
                  </p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
