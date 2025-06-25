"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"

interface Profile {
  id: string
  created_at: string
  email: string
  full_name: string
  role: "admin" | "mentor" | "student"
  phone: string | null
  subject_specialization: string | null
  experience_years: number | null
  current_class: string | null
  target_exam: string | null
  status: "active" | "inactive" | "pending"
}

export default function UsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!supabase) {
        throw new Error("Supabase client not initialized")
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setProfiles(data as Profile[])
    } catch (err) {
      console.error("Error fetching profiles:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch profiles")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <Button onClick={() => router.push("/admin/users/create")}>Add New User</Button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error: {error}. Please try refreshing the page.
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p>Loading users from Supabase...</p>
        </div>
      ) : (
        <Table>
          <TableCaption>A list of all users in the system.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No users found. Add some users to get started.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
            <TableRow key={profile.id}>
              <TableCell className="font-medium">{profile.id.substring(0, 8)}...</TableCell>
              <TableCell>{profile.full_name}</TableCell>
              <TableCell>{profile.email}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium 
                  ${profile.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                    profile.role === 'mentor' ? 'bg-blue-100 text-blue-800' : 
                    'bg-green-100 text-green-800'}`}>
                  {profile.role}
                </span>
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-medium 
                  ${profile.status === 'active' ? 'bg-green-100 text-green-800' : 
                    profile.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'}`}>
                  {profile.status}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => router.push(`/admin/users/${profile.id}`)}>
                  View
                </Button>
              </TableCell>
            </TableRow>
          )))}
        </TableBody>
      </Table>
      )}
    </div>
  )
}
