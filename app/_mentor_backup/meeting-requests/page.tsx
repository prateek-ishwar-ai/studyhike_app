"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Calendar, Clock, User, MessageSquare, Check, X } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function MentorMeetingRequestsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [acceptedRequests, setAcceptedRequests] = useState<any[]>([])
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false)
  const [acceptFormData, setAcceptFormData] = useState({
    scheduled_time: "",
    meet_link: ""
  })
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  
  // Track loading state for each section
  const [sectionLoading, setSectionLoading] = useState({
    auth: true,
    pending: true,
    accepted: true
  })

  // Helper function to handle errors
  const handleError = (message: string, details?: any) => {
    console.error(message, details);
    setError(message);
    setLoading(false);
    setSectionLoading({
      auth: false,
      pending: false,
      accepted: false
    });
    
    // Clear any demo mode flags
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demo_mentor_mode');
    }
    
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
      duration: 5000
    });
  }

  // Effect to get the current user
  useEffect(() => {
    async function getCurrentUser() {
      try {
        if (!supabase) {
          console.error("Supabase client not initialized");
          return;
        }
        
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Error getting user:", error.message);
          return;
        }
        
        if (user) {
          console.log("User authenticated:", user.id);
          setUserId(user.id);
        } else {
          console.log("No authenticated user found");
        }
      } catch (e) {
        console.error("Error in getCurrentUser:", e);
      }
    }
    
    getCurrentUser();
  }, []);

  // Diagnostic function to check Supabase connection and table existence
  useEffect(() => {
    async function runDiagnostics() {
      try {
        setLoading(true)
        setSectionLoading(prev => ({ ...prev, auth: true }))
        
        console.log("Running diagnostics for mentor meeting requests page")
        
        // Clear any demo mode flags
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('demo_mentor_mode');
        }
        
        const diagnostics: any = {
          supabaseInitialized: !!supabase,
          authenticated: false,
          userId: null,
          tableExists: false,
          canSelect: false,
          canUpdate: false,
          errorDetails: null
        }
        
        if (!supabase) {
          handleError("Supabase client not initialized. Please check your connection.");
          setDiagnosticInfo(diagnostics);
          return;
        }

        // Check authentication
        try {
          console.log("Checking authentication");
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            handleError(`Authentication error: ${userError.message}. Please log in again.`, userError);
            diagnostics.authError = userError.message;
            setDiagnosticInfo(diagnostics);
            return;
          }

          if (!user) {
            handleError("Not authenticated. Please log in to access meeting requests.");
            return;
          }

          console.log("User authenticated:", user.id);
          diagnostics.authenticated = true;
          diagnostics.userId = user.id;
          setUserId(user.id);
          setSectionLoading(prev => ({ ...prev, auth: false }));
        } catch (error: any) {
          handleError(`Authentication error: ${error.message || "Unknown error"}. Please try again.`, error);
          diagnostics.authError = error.message || "Unknown authentication error";
          setDiagnosticInfo(diagnostics);
          return;
        }

        // Check if table exists by trying to get its schema
        try {
          console.log("Checking if meeting_requests table exists");
          const { error: schemaError } = await supabase
            .from('meeting_requests')
            .select('id')
            .limit(1);
          
          diagnostics.tableExists = !schemaError;
          diagnostics.schemaError = schemaError ? schemaError.message : null;
          
          if (schemaError) {
            handleError(`The meeting_requests table might not exist: ${schemaError.message}. Please contact an administrator.`, schemaError);
            setDiagnosticInfo(diagnostics);
            return;
          }
        } catch (e: any) {
          handleError(`Error checking meeting_requests table: ${e.message || "Unknown error"}`, e);
          diagnostics.tableError = e.message || "Unknown table error";
          setDiagnosticInfo(diagnostics);
          return;
        }

        // Try a simple select for pending requests
        try {
          console.log("Testing select permissions");
          const { error: selectError } = await supabase
            .from('meeting_requests')
            .select('id')
            .eq('status', 'pending')
            .limit(1);
          
          diagnostics.canSelect = !selectError;
          diagnostics.selectError = selectError ? selectError.message : null;
          
          if (selectError) {
            handleError(`Error selecting from meeting_requests: ${selectError.message}. You may not have the required permissions.`, selectError);
            setDiagnosticInfo(diagnostics);
            return;
          }
        } catch (e: any) {
          handleError(`Error during select test: ${e.message || "Unknown error"}`, e);
          diagnostics.selectCatchError = e.message || "Unknown select error";
          setDiagnosticInfo(diagnostics);
          return;
        }

        // Check user role
        try {
          console.log("Checking user role");
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
          
          diagnostics.hasProfile = !profileError && !!profileData;
          diagnostics.userRole = profileData?.role;
          diagnostics.profileError = profileError ? profileError.message : null;
          
          if (profileError) {
            console.warn("Could not verify mentor role:", profileError.message);
            // Continue anyway, we'll check permissions through RLS
          } else if (profileData && profileData.role !== 'mentor' && profileData.role !== 'admin') {
            handleError(`You need to have a mentor role to access this page. Your current role is: ${profileData.role}`);
            setDiagnosticInfo(diagnostics);
            return;
          }
        } catch (e: any) {
          console.warn("Error checking profile:", e);
          diagnostics.profileCatchError = e.message || "Unknown profile error";
          // Continue anyway, we'll check permissions through RLS
        }

        setDiagnosticInfo(diagnostics);
        setError(null);
        
        console.log("Diagnostics passed, fetching real data");
        // If we've made it this far, fetch the actual data
        fetchPendingRequests();
        fetchAcceptedRequests();
      } catch (error: any) {
        handleError(`Unexpected error: ${error.message || "Unknown error"}`, error);
        setDiagnosticInfo({ unexpectedError: error.message || "Unknown error" });
      }
    }

    runDiagnostics();
  }, [router])
  
  // Function to fetch pending meeting requests
  const fetchPendingRequests = async () => {
    // Get the current user ID to ensure it's up-to-date
    let currentUserId = userId;
    
    if (!currentUserId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          currentUserId = user.id;
          setUserId(user.id);
        } else {
          handleError("User ID not found. Please log in again.");
          return;
        }
      } catch (error) {
        console.error("Error getting current user:", error);
        handleError("Error getting user information. Please try again.");
        return;
      }
    }
    
    setSectionLoading(prev => ({ ...prev, pending: true }));
    console.log("Fetching pending meeting requests for mentor:", currentUserId);
    
    // Real database fetch for non-demo mode
    try {
      console.log("Fetching pending requests from database")
      const { data, error } = await supabase
        .from('meeting_requests')
        .select(`
          id,
          student_id,
          mentor_id,
          topic,
          preferred_time,
          status,
          created_at
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error("Error fetching pending requests:", error);
        setSectionLoading(prev => ({ ...prev, pending: false }));
        setPendingRequests([]);
        return;
      }
      
      console.log(`Retrieved ${data?.length || 0} pending requests`)
      
      // Fetch student names for the requests
      if (data && data.length > 0) {
        const studentIds = [...new Set(data.map(req => req.student_id))]
        
        console.log("Fetching student profiles for", studentIds.length, "students")
        const { data: studentData, error: studentError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', studentIds)
        
        if (!studentError && studentData) {
          console.log(`Retrieved ${studentData.length} student profiles`)
          
          // Create a map of student IDs to profile data
          const studentMap = Object.fromEntries(
            studentData.map(student => [student.id, { 
              full_name: student.full_name,
              email: student.email
            }])
          )
          
          // Add student info to the meeting requests
          data.forEach(req => {
            if (req.student_id && studentMap[req.student_id]) {
              req.student_name = studentMap[req.student_id].full_name
              req.student_email = studentMap[req.student_id].email
            }
          })
        } else if (studentError) {
          console.error("Error fetching student profiles:", studentError)
        }
      }
      
      setPendingRequests(data || [])
      setSectionLoading(prev => ({ ...prev, pending: false }))
      setLoading(false)
    } catch (error) {
      console.error("Error in fetchPendingRequests:", error);
      setSectionLoading(prev => ({ ...prev, pending: false }));
      setPendingRequests([]);
      setLoading(false);
    }
  }
  
  // Function to fetch accepted meeting requests
  const fetchAcceptedRequests = async () => {
    // Get the current user ID to ensure it's up-to-date
    let currentUserId = userId;
    
    if (!currentUserId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          currentUserId = user.id;
          setUserId(user.id);
        } else {
          console.warn("User ID not found when fetching accepted requests");
          setSectionLoading(prev => ({ ...prev, accepted: false }));
          return;
        }
      } catch (error) {
        console.error("Error getting current user:", error);
        setSectionLoading(prev => ({ ...prev, accepted: false }));
        return;
      }
    }
    
    setSectionLoading(prev => ({ ...prev, accepted: true }));
    console.log("Fetching accepted meeting requests for mentor:", currentUserId);
    
    // Real database fetch
    try {
      console.log("Fetching accepted requests from database");
      const { data, error } = await supabase
        .from('meeting_requests')
        .select(`
          id,
          student_id,
          mentor_id,
          topic,
          preferred_time,
          status,
          created_at,
          accepted_by,
          scheduled_time,
          meet_link
        `)
        .eq('status', 'accepted')
        .or(`accepted_by.eq.${currentUserId},mentor_id.eq.${currentUserId}`)
        .order('scheduled_time', { ascending: true })
      
      if (error) {
        console.error("Error fetching accepted requests:", error);
        setSectionLoading(prev => ({ ...prev, accepted: false }));
        setAcceptedRequests([]);
        return;
      }
      
      console.log(`Retrieved ${data?.length || 0} accepted requests`)
      
      // Fetch student names for the requests
      if (data && data.length > 0) {
        const studentIds = [...new Set(data.map(req => req.student_id))]
        
        console.log("Fetching student profiles for accepted requests")
        const { data: studentData, error: studentError } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', studentIds)
        
        if (!studentError && studentData) {
          console.log(`Retrieved ${studentData.length} student profiles for accepted requests`)
          
          // Create a map of student IDs to profile data
          const studentMap = Object.fromEntries(
            studentData.map(student => [student.id, { 
              full_name: student.full_name,
              email: student.email
            }])
          )
          
          // Add student info to the meeting requests
          data.forEach(req => {
            if (req.student_id && studentMap[req.student_id]) {
              req.student_name = studentMap[req.student_id].full_name
              req.student_email = studentMap[req.student_id].email
            }
          })
        } else if (studentError) {
          console.error("Error fetching student profiles for accepted requests:", studentError)
        }
      }
      
      setAcceptedRequests(data || [])
      setSectionLoading(prev => ({ ...prev, accepted: false }))
      setLoading(false)
    } catch (error) {
      console.error("Error in fetchAcceptedRequests:", error);
      setSectionLoading(prev => ({ ...prev, accepted: false }));
      setAcceptedRequests([]);
      setLoading(false);
    }
  }
  
  // Function to handle accepting a meeting request
  const handleAcceptRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Basic validation
      if (!selectedRequest) {
        toast({
          title: "Error",
          description: "No meeting request selected",
          variant: "destructive"
        });
        return;
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to accept meeting requests",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Accepting meeting request:", selectedRequest.id, "by mentor:", user.id);
      
      // Create a simple update object
      const updateData = {
        status: 'accepted',
        accepted_by: user.id,
        mentor_id: user.id  // Also set the mentor_id field to ensure proper permissions
      };
      
      // Only add these fields if they have values
      if (acceptFormData.scheduled_time) {
        updateData['scheduled_time'] = acceptFormData.scheduled_time;
      }
      
      if (acceptFormData.meet_link) {
        updateData['meet_link'] = acceptFormData.meet_link;
      }
      
      console.log("Update data:", updateData);
      
      // Perform the update
      const { error } = await supabase
        .from('meeting_requests')
        .update(updateData)
        .eq('id', selectedRequest.id);
      
      if (error) {
        console.error("Error accepting meeting request:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to accept meeting request",
          variant: "destructive"
        });
        return;
      }
      
      // Success!
      console.log("Meeting request accepted successfully");
      
      // Send email notifications
      try {
        const response = await fetch('/api/meetings/notify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meetingId: selectedRequest.id,
            action: 'confirmed'
          }),
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log('Email notifications sent successfully');
        } else {
          console.warn('Email notification failed:', result.error);
          // Continue anyway as the meeting was accepted
        }
      } catch (notifyError) {
        console.error('Error sending email notifications:', notifyError);
        // Continue anyway as the meeting was accepted
      }
      
      toast({
        title: "Success",
        description: "Meeting request accepted successfully"
      });
      
      // Update UI
      setIsAcceptDialogOpen(false);
      setAcceptFormData({
        scheduled_time: "",
        meet_link: ""
      });
      
      // Refresh data
      fetchPendingRequests();
      fetchAcceptedRequests();
      
    } catch (error) {
      console.error("Error in handleAcceptRequest:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  }
  
  // Function to handle input changes in the accept form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    console.log(`Input changed: ${name} = ${value}`);
    
    setAcceptFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }
  
  // Function to handle opening the accept dialog
  const handleOpenAcceptDialog = (request: any) => {
    setSelectedRequest(request);
    
    // Set a default scheduled time (tomorrow at the current time)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format for datetime-local input (YYYY-MM-DDThh:mm)
    const formattedDate = tomorrow.toISOString().slice(0, 16);
    
    setAcceptFormData({
      scheduled_time: formattedDate,
      meet_link: ""
    });
    
    setIsAcceptDialogOpen(true);
  }
  
  // Fetch meeting requests when userId changes
  useEffect(() => {
    if (userId && !error) {
      fetchPendingRequests()
      fetchAcceptedRequests()
    }
  }, [userId, error])

  const createTable = async () => {
    if (!supabase) {
      toast({
        title: "Error",
        description: "Supabase client not initialized",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      const { error } = await supabase.rpc('create_meeting_requests_table')
      
      if (error) {
        toast({
          title: "Error",
          description: `Failed to create table: ${error.message}`,
          variant: "destructive"
        })
        console.error("Error creating table:", error)
      } else {
        toast({
          title: "Success",
          description: "Meeting requests table created successfully",
        })
        
        // Refresh the page to run diagnostics again
        window.location.reload()
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: `Unexpected error: ${e.message}`,
        variant: "destructive"
      })
      console.error("Error in createTable:", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Meeting Requests</h1>
          <p className="text-muted-foreground">Manage student meeting requests and scheduled meetings</p>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {loading && sectionLoading.auth ? (
          <div className="flex flex-col justify-center items-center h-64">
            <LoadingSpinner animation="spin" size="lg" text="Checking authentication..." />
          </div>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending Requests
                {pendingRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{pendingRequests.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="accepted">
                Accepted Meetings
                {acceptedRequests.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{acceptedRequests.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="space-y-4">
              {sectionLoading.pending ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner animation="bounce" size="md" text="Loading pending requests..." />
                </div>
              ) : pendingRequests.length > 0 ? (
                <div className="staggered-fade-in space-y-4">
                  {pendingRequests.map((request) => (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{request.topic}</CardTitle>
                            <CardDescription>
                              From {request.student_name || 'Unknown Student'} ({request.student_email || 'No email'})
                            </CardDescription>
                          </div>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Requested on {new Date(request.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Preferred time: {request.preferred_time}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end">
                        <Button onClick={() => handleOpenAcceptDialog(request)}>
                          <Check className="mr-2 h-4 w-4" />
                          Accept Request
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Pending Requests</CardTitle>
                    <CardDescription>
                      You don't have any pending meeting requests at the moment.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground">
                      When students request meetings, they will appear here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="accepted" className="space-y-4">
              {sectionLoading.accepted ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner animation="progress" size="md" text="Loading accepted meetings..." />
                </div>
              ) : acceptedRequests.length > 0 ? (
                <div className="staggered-fade-in space-y-4">
                  {acceptedRequests.map((request) => (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{request.topic}</CardTitle>
                            <CardDescription>
                              With {request.student_name || 'Unknown Student'} ({request.student_email || 'No email'})
                            </CardDescription>
                          </div>
                          <Badge variant="success">Accepted</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Scheduled for: {new Date(request.scheduled_time).toLocaleString()}</span>
                          </div>
                          {request.meet_link && (
                            <div className="flex items-center text-sm">
                              <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span>Meeting link: </span>
                              <a href={request.meet_link} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline">
                                {request.meet_link}
                              </a>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end">
                        {request.meet_link && (
                          <Button asChild variant="outline">
                            <a href={request.meet_link} target="_blank" rel="noopener noreferrer">
                              Join Meeting
                            </a>
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Accepted Meetings</CardTitle>
                    <CardDescription>
                      You haven't accepted any meeting requests yet.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground">
                      When you accept meeting requests, they will appear here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
        
        {/* Accept Meeting Dialog */}
        <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Accept Meeting Request</DialogTitle>
              <DialogDescription>
                Schedule a meeting with {selectedRequest?.student_name || 'the student'}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAcceptRequest}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="scheduled_time">Scheduled Time</Label>
                  <Input
                    id="scheduled_time"
                    name="scheduled_time"
                    type="datetime-local"
                    value={acceptFormData.scheduled_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="meet_link">Meeting Link (Optional)</Label>
                  <Input
                    id="meet_link"
                    name="meet_link"
                    placeholder="e.g., https://meet.google.com/..."
                    value={acceptFormData.meet_link}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAcceptDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" animation="spin" />
                      <span className="ml-2">Accepting...</span>
                    </>
                  ) : (
                    "Accept Request"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Diagnostic Information */}
        {error && (
          <div className="mt-8 border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2">Diagnostic Information</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This information can help diagnose issues with the meeting requests feature
            </p>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
              {JSON.stringify(diagnosticInfo, null, 2)}
            </pre>
            
            {/* Admin-only table creation button */}
            <div className="mt-4">
              <h3 className="text-md font-semibold mb-2">Attempt to Create Table (Admin Only)</h3>
              <Button variant="outline" onClick={createTable}>
                Create meeting_requests Table
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}