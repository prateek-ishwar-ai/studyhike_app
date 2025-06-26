"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { Database, Trash2, RefreshCw, Plus, Shield } from "lucide-react"

interface Bucket {
  id: string
  name: string
  owner: string
  created_at: string
  updated_at: string
  public: boolean
}

interface Policy {
  id: string
  name: string
  definition: any
}

export default function StorageManagementPage() {
  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [policies, setPolicies] = useState<Record<string, Policy[]>>({})
  const [loading, setLoading] = useState(true)
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null)

  useEffect(() => {
    fetchBuckets()
  }, [])

  const fetchBuckets = async () => {
    try {
      setLoading(true)
      
      if (!supabase) {
        console.error("Supabase client not initialized")
        return
      }

      const { data, error } = await supabase.storage.listBuckets()

      if (error) {
        console.error("Error fetching buckets:", error)
        toast({
          title: "Error fetching buckets",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setBuckets(data as Bucket[])
        
        // Fetch policies for each bucket
        const policiesData: Record<string, Policy[]> = {}
        
        for (const bucket of data) {
          try {
            const { data: bucketPolicies, error: policyError } = await supabase.rpc(
              'get_policies_for_bucket',
              { bucket_name: bucket.name }
            )
            
            if (policyError) {
              console.error(`Error fetching policies for bucket ${bucket.name}:`, policyError)
            } else {
              policiesData[bucket.name] = bucketPolicies || []
            }
          } catch (err) {
            console.error(`Error fetching policies for bucket ${bucket.name}:`, err)
          }
        }
        
        setPolicies(policiesData)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const createHomeworkBucket = async () => {
    try {
      setLoading(true)
      
      if (!supabase) {
        console.error("Supabase client not initialized")
        return
      }

      // Create the bucket
      const { data, error } = await supabase.storage.createBucket('homework-submissions', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      })

      if (error) {
        console.error("Error creating bucket:", error)
        toast({
          title: "Error creating bucket",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Bucket created",
          description: "Homework submissions bucket created successfully",
        })
        
        // Create policies
        await createHomeworkPolicies()
        
        // Refresh buckets
        fetchBuckets()
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const createHomeworkPolicies = async () => {
    try {
      if (!supabase) return
      
      // Create policy for students to upload their own files
      await supabase.storage.from('homework-submissions')
        .createPolicy('Students can upload homework files', {
          name: 'Students can upload homework files',
          definition: {
            role: 'authenticated',
            permission: 'INSERT',
            check: "((storage.foldername(name))[1] = auth.uid()::text)"
          }
        })
      
      // Create policy for students to read their own files
      await supabase.storage.from('homework-submissions')
        .createPolicy('Students can read their own homework files', {
          name: 'Students can read their own homework files',
          definition: {
            role: 'authenticated',
            permission: 'SELECT',
            check: "((storage.foldername(name))[1] = auth.uid()::text)"
          }
        })
      
      // Create policy for admins to manage all files
      await supabase.storage.from('homework-submissions')
        .createPolicy('Admins can manage all homework files', {
          name: 'Admins can manage all homework files',
          definition: {
            role: 'authenticated',
            permission: 'ALL',
            check: "EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')"
          }
        })
      
      toast({
        title: "Policies created",
        description: "Storage policies created successfully",
      })
    } catch (error) {
      console.error("Error creating policies:", error)
      toast({
        title: "Error creating policies",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Storage Management</h1>
          <p className="text-gray-500">Manage storage buckets and policies</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchBuckets} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={createHomeworkBucket}>
            <Plus className="h-4 w-4 mr-2" />
            Create Homework Bucket
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>Loading storage buckets...</p>
        </div>
      ) : buckets.length === 0 ? (
        <div className="text-center py-10">
          <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium">No storage buckets found</h3>
          <p className="text-gray-500">Create a bucket to get started</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {buckets.map((bucket) => (
            <Card key={bucket.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">{bucket.name}</CardTitle>
                  <Badge variant={bucket.public ? "default" : "outline"}>
                    {bucket.public ? "Public" : "Private"}
                  </Badge>
                </div>
                <CardDescription>
                  Created: {new Date(bucket.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Policies</h3>
                    {policies[bucket.name]?.length > 0 ? (
                      <div className="space-y-2">
                        {policies[bucket.name].map((policy) => (
                          <div key={policy.id} className="p-2 border rounded-md">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">{policy.name}</span>
                            </div>
                            <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(policy.definition, null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No policies found for this bucket</p>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedBucket(bucket.name)}>
                      View Files
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}