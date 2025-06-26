"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import type { Session } from "@/types/supabase"

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!supabase) {
        throw new Error("Supabase client not initialized")
      }

      const { data, error } = await supabase
        .from("sessions")
        .select(`
          *,
          student:student_id(full_name),
          mentor:mentor_id(full_name)
        `)
        .order("scheduled_at", { ascending: false })

      if (error) {
        throw error
      }

      setSessions(data as any)
    } catch (err) {
      console.error("Error fetching sessions:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch sessions")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <Button onClick={() => router.push("/admin/sessions/create")}>Schedule New Session</Button>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error: {error}. Please try refreshing the page.
        </div>
      )}
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p>Loading sessions from Supabase...</p>
        </div>
      ) : (
        <Table>
          <TableCaption>A list of all scheduled sessions.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Mentor</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Scheduled At</TableHead>
              <TableHead>Duration (min)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No sessions found. Schedule a new session to get started.
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.title}</TableCell>
                  <TableCell>{session.student?.full_name || 'Unknown Student'}</TableCell>
                  <TableCell>{session.mentor?.full_name || 'Unknown Mentor'}</TableCell>
                  <TableCell>{session.subject}</TableCell>
                  <TableCell>{formatDate(session.scheduled_at)}</TableCell>
                  <TableCell>{session.duration}</TableCell>
                  <TableCell>{getStatusBadge(session.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/admin/sessions/${session.id}`)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}