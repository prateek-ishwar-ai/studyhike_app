"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Mail, Phone, Calendar, MapPin, Target, BookOpen, Save, Loader } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

interface ProfileData {
  fullName: string
  email: string
  phone: string
  dateOfBirth: string
  address: string
  targetExam: string
  currentClass: string
  schoolName: string
  preferredSubjects: string[]
  studyGoal: string
  bio: string
  avatarUrl?: string
}

interface ProfileStats {
  totalHomework: number
  completedHomework: number
  averageScore: number
  studyHours: number
  sessionsAttended: number
  currentStreak: number
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    targetExam: "JEE Main & Advanced",
    currentClass: "12th",
    schoolName: "",
    preferredSubjects: ["Physics", "Mathematics"],
    studyGoal: "",
    bio: "",
  })
  
  const [stats, setStats] = useState<ProfileStats>({
    totalHomework: 0,
    completedHomework: 0,
    averageScore: 0,
    studyHours: 0,
    sessionsAttended: 0,
    currentStreak: 0,
  })

  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  // Fetch profile data from Supabase
  useEffect(() => {
    async function fetchProfile() {
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

        setUserId(user.id)

        // Get profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        
        if (profileError) {
          console.error("Profile error:", profileError)
          toast({
            title: "Error",
            description: "Failed to load profile. Please try again later.",
            variant: "destructive"
          })
        }
        
        // Get student-specific data for profile fields
        const { data: studentProfileData, error: studentProfileError } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
          
        if (studentProfileError) {
          console.error("Error fetching student profile data:", studentProfileError);
        }
        
        // Combine profile and student data
        setProfile({
          fullName: profileData?.full_name || "",
          email: user.email || "",
          phone: profileData?.phone || "",
          dateOfBirth: profileData?.date_of_birth || "",
          address: profileData?.address || "",
          targetExam: profileData?.target_exam || "JEE Main & Advanced",
          currentClass: profileData?.current_class || "12th",
          // Get these fields from student profile data if available
          schoolName: studentProfileData?.school_name || "",
          preferredSubjects: studentProfileData?.preferred_subjects || ["Physics", "Mathematics"],
          studyGoal: studentProfileData?.study_goal || "",
          bio: studentProfileData?.bio || "",
          avatarUrl: profileData?.avatar_url
        })
        
        // If profile doesn't exist, create it
        if (!profileData) {
          console.log("Creating new profile for user:", user.id);
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: user.user_metadata?.full_name || "",
              avatar_url: user.user_metadata?.avatar_url,
              role: "student"
            });
            
          if (insertError) {
            console.error("Error creating profile record:", insertError);
          }
        }

        // Fetch additional stats for all cases, with or without student data
        const [studentResult, homeworkStats, testStats, sessionsStats] = await Promise.all([
          // Try to get student data
          supabase
            .from('students')
            .select('*')
            .eq('id', user.id)
            .maybeSingle(),  // use maybeSingle() instead of single()
          
          // Get homework stats
          supabase
            .from('homework')
            .select('*')
            .eq('student_id', user.id),
          
          // Get test stats
          supabase
            .from('tests')
            .select('score, max_score')
            .eq('student_id', user.id),
          
          // Get sessions stats
          supabase
            .from('sessions')
            .select('*')
            .eq('student_id', user.id)
        ])

        const studentData = studentResult.data;

        // Calculate stats
        const totalHomework = homeworkStats.data?.length || 0
        const completedHomework = homeworkStats.data?.filter(hw => hw.status === 'submitted' || hw.status === 'reviewed').length || 0
        
        let averageScore = 0
        if (testStats.data && testStats.data.length > 0) {
          const scores = testStats.data.map(test => (test.score / test.max_score) * 100)
          averageScore = scores.reduce((a, b) => a + b, 0) / scores.length
        }

        // Set stats regardless of whether student data exists
        setStats({
          totalHomework,
          completedHomework,
          averageScore: Math.round(averageScore),
          studyHours: studentData?.total_study_hours || 0,
          sessionsAttended: sessionsStats.data?.filter(s => s.status === 'completed').length || 0,
          currentStreak: studentData?.study_streak || 0
        })
        
        // If student record doesn't exist, create it
        if (!studentData) {
          console.log("Creating new student record for user:", user.id);
          const { error: insertError } = await supabase
            .from('students')
            .insert({
              id: user.id,
              study_streak: 0,
              total_study_hours: 0
            });
            
          if (insertError) {
            console.error("Error creating student record:", insertError);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  const handleSave = async () => {
    if (!userId || !supabase) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      })
      return
    }

    setSubmitLoading(true)

    try {
      console.log("Updating profile for user:", userId);
      console.log("Profile data to update:", {
        full_name: profile.fullName,
        phone: profile.phone,
        date_of_birth: profile.dateOfBirth,
        preferred_subjects: profile.preferredSubjects
      });

      // First check if the profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking profile existence:", checkError);
        throw checkError;
      }

      let updateResult;
      
      if (existingProfile) {
        // Update existing profile with only the fields that exist in the database
        const updateData: any = {
          full_name: profile.fullName,
          phone: profile.phone,
          target_exam: profile.targetExam,
          current_class: profile.currentClass
        };
        
        // Try to update the profile with only valid fields
        updateResult = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId);
      } else {
        // Insert new profile if it doesn't exist
        updateResult = await supabase
          .from('profiles')
          .insert({
            id: userId,
            full_name: profile.fullName,
            email: profile.email,
            phone: profile.phone,
            target_exam: profile.targetExam,
            current_class: profile.currentClass,
            role: "student",
            status: "active"
          });
      }

      if (updateResult.error) {
        console.error("Database operation failed:", updateResult.error);
        throw updateResult.error;
      }

      // Now update the student-specific information in the students table
      try {
        // First check if student record exists
        const { data: studentData, error: studentCheckError } = await supabase
          .from('students')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (studentCheckError) {
          console.error("Error checking student record:", studentCheckError);
          // Continue anyway since the profile was updated
        }

        // Update or insert student record with additional profile information
        const studentUpdateData = {
          bio: profile.bio,
          school_name: profile.schoolName,
          preferred_subjects: profile.preferredSubjects,
          study_goal: profile.studyGoal
        };

        if (studentData) {
          // Update existing student record
          const { error: studentUpdateError } = await supabase
            .from('students')
            .update(studentUpdateData)
            .eq('id', userId);

          if (studentUpdateError) {
            console.error("Error updating student record:", studentUpdateError);
            // Continue anyway since the profile was updated
          }
        } else {
          // Insert new student record
          const { error: studentInsertError } = await supabase
            .from('students')
            .insert({
              id: userId,
              ...studentUpdateData,
              plan: 'free'
            });

          if (studentInsertError) {
            console.error("Error creating student record:", studentInsertError);
            // Continue anyway since the profile was updated
          }
        }
      } catch (studentError) {
        console.error("Error handling student data:", studentError);
        // Continue anyway since the profile was updated
      }

      console.log("Profile updated successfully");
      setEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully!"
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitLoading(false);
    }
  
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin mb-4" />
        <p>Loading your profile...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              {profile.avatarUrl ? (
                <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
              ) : (
                <AvatarFallback className="text-xl">
                  {profile.fullName ? profile.fullName.charAt(0) : '?'}
                </AvatarFallback>
              )}
            </Avatar>
            <CardTitle>{profile.fullName || "Your Name"}</CardTitle>
            <CardDescription>{profile.targetExam} Aspirant</CardDescription>
            <Badge variant="outline" className="w-fit mx-auto mt-2">
              Class {profile.currentClass}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span>{profile.email || "Email not set"}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{profile.phone || "Phone not set"}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{profile.address || "Address not set"}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Target className="h-4 w-4" />
              <span>{profile.studyGoal || "Study goal not set"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </div>
                    <Button onClick={() => (editing ? handleSave() : setEditing(true))} disabled={submitLoading}>
                      {editing ? (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {submitLoading ? "Saving..." : "Save"}
                        </>
                      ) : (
                        "Edit Profile"
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={profile.fullName}
                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={profile.dateOfBirth}
                        onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      disabled={!editing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      disabled={!editing}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="academic">
              <Card>
                <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
                  <CardDescription>Your educational background and goals</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currentClass">Current Class</Label>
                      <Select
                        value={profile.currentClass}
                        onValueChange={(value) => setProfile({ ...profile, currentClass: value })}
                        disabled={!editing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="11th">11th Grade</SelectItem>
                          <SelectItem value="12th">12th Grade</SelectItem>
                          <SelectItem value="Dropper">Dropper</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="targetExam">Target Exam</Label>
                      <Select
                        value={profile.targetExam}
                        onValueChange={(value) => setProfile({ ...profile, targetExam: value })}
                        disabled={!editing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="JEE Main">JEE Main</SelectItem>
                          <SelectItem value="JEE Main & Advanced">JEE Main & Advanced</SelectItem>
                          <SelectItem value="NEET">NEET</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="schoolName">School Name</Label>
                    <Input
                      id="schoolName"
                      value={profile.schoolName}
                      onChange={(e) => setProfile({ ...profile, schoolName: e.target.value })}
                      disabled={!editing}
                    />
                  </div>

                  <div>
                    <Label htmlFor="studyGoal">Study Goal</Label>
                    <Input
                      id="studyGoal"
                      value={profile.studyGoal}
                      onChange={(e) => setProfile({ ...profile, studyGoal: e.target.value })}
                      disabled={!editing}
                      placeholder="e.g., Get under AIR 1000 in JEE Main"
                    />
                  </div>

                  <div>
                    <Label>Preferred Subjects</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {["Physics", "Chemistry", "Mathematics", "Biology"].map((subject) => (
                        <Badge
                          key={subject}
                          variant={profile.preferredSubjects.includes(subject) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (!editing) return
                            const subjects = profile.preferredSubjects.includes(subject)
                              ? profile.preferredSubjects.filter((s) => s !== subject)
                              : [...profile.preferredSubjects, subject]
                            setProfile({ ...profile, preferredSubjects: subjects })
                          }}
                        >
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Homework Stats</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.completedHomework}/{stats.totalHomework}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((stats.completedHomework / stats.totalHomework) * 100)}% completion rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.averageScore}%</div>
                    <p className="text-xs text-muted-foreground">Across all subjects</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Study Hours</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.studyHours}h</div>
                    <p className="text-xs text-muted-foreground">Total study time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.currentStreak} days</div>
                    <p className="text-xs text-muted-foreground">Keep it up! 🔥</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
