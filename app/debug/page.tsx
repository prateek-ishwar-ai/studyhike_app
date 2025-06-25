"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function DebugPage() {
  const [user, setUser] = useState<any>(null)
  const [tables, setTables] = useState<string[]>([])
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [tableData, setTableData] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [supabaseInfo, setSupabaseInfo] = useState<string>("")

  useEffect(() => {
    async function checkSupabase() {
      try {
        // Check if Supabase is initialized
        if (!supabase) {
          setSupabaseInfo("Supabase client not initialized")
          return
        }

        setSupabaseInfo(`Supabase client initialized with URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          setError(`Authentication error: ${userError.message}`)
          return
        }

        setUser(user)

        // Get list of tables
        const { data, error: tablesError } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public')
        
        if (tablesError) {
          setError(`Error fetching tables: ${tablesError.message}`)
          return
        }

        if (data) {
          const tableNames = data.map(t => t.tablename)
          setTables(tableNames)
        }
      } catch (e: any) {
        setError(`Unexpected error: ${e.message}`)
      }
    }

    checkSupabase()
  }, [])

  const fetchTableData = async (tableName: string) => {
    if (!supabase) {
      setError("Supabase client not initialized")
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const { data, error: dataError } = await supabase
        .from(tableName)
        .select('*')
        .limit(10)
      
      if (dataError) {
        setError(`Error fetching data from ${tableName}: ${dataError.message}`)
        setTableData([])
      } else {
        setTableData(data || [])
        setSelectedTable(tableName)
      }
    } catch (e: any) {
      setError(`Unexpected error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testMeetingRequestInsert = async () => {
    if (!supabase || !user) {
      setError("Supabase client not initialized or user not logged in")
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const { data, error: insertError } = await supabase
        .from('meeting_requests')
        .insert({
          student_id: user.id,
          topic: 'Test meeting request from debug page',
          status: 'pending'
        })
        .select()
        .single()
      
      if (insertError) {
        setError(`Error inserting into meeting_requests: ${insertError.message}`)
      } else {
        setError(null)
        alert(`Successfully inserted test record with ID: ${data.id}`)
        
        // Refresh the table data if we're viewing meeting_requests
        if (selectedTable === 'meeting_requests') {
          fetchTableData('meeting_requests')
        }
      }
    } catch (e: any) {
      setError(`Unexpected error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Database Debug Page</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Supabase Status</CardTitle>
          <CardDescription>Information about the Supabase connection</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-2"><strong>Status:</strong> {supabaseInfo || "Checking..."}</p>
          <p className="mb-2"><strong>User:</strong> {user ? `Logged in as ${user.email} (${user.id})` : "Not logged in"}</p>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mt-4">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Database Tables</CardTitle>
          <CardDescription>Select a table to view its data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {tables.map(table => (
              <Button 
                key={table} 
                variant={selectedTable === table ? "default" : "outline"}
                onClick={() => fetchTableData(table)}
              >
                {table}
              </Button>
            ))}
          </div>
          
          {selectedTable === 'meeting_requests' && (
            <Button 
              onClick={testMeetingRequestInsert} 
              className="mb-4"
              disabled={loading || !user}
            >
              Test Insert into meeting_requests
            </Button>
          )}
          
          {loading ? (
            <p>Loading data...</p>
          ) : selectedTable ? (
            <>
              <h3 className="text-lg font-medium mb-2">Data from {selectedTable}</h3>
              {tableData.length > 0 ? (
                <Textarea 
                  className="font-mono text-sm" 
                  rows={20} 
                  readOnly 
                  value={JSON.stringify(tableData, null, 2)}
                />
              ) : (
                <p>No data found in this table.</p>
              )}
            </>
          ) : (
            <p>Select a table to view its data</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}