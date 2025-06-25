// This script can be run from the browser console to diagnose and fix meeting requests issues

async function diagnoseMeetingRequests() {
  console.log("Starting meeting requests diagnostics...");
  
  // Check if Supabase is available
  if (typeof window.supabase === 'undefined') {
    console.error("Supabase client not found in window object");
    return;
  }
  
  const supabase = window.supabase;
  console.log("Supabase client found");
  
  // Check authentication
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error("Authentication error:", userError);
    return;
  }
  
  if (!user) {
    console.error("Not authenticated. Please log in.");
    return;
  }
  
  console.log("Authenticated as:", user.email, "User ID:", user.id);
  
  // Check if table exists
  try {
    console.log("Checking if meeting_requests table exists...");
    const { data, error } = await supabase
      .from('meeting_requests')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error("Error accessing meeting_requests table:", error);
      console.log("The table might not exist or you don't have permission to access it");
    } else {
      console.log("meeting_requests table exists and is accessible");
      console.log("Sample data:", data);
    }
  } catch (e) {
    console.error("Error checking table:", e);
  }
  
  // Check user role
  try {
    console.log("Checking user role...");
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error("Error fetching user profile:", error);
    } else {
      console.log("User role:", data.role);
    }
  } catch (e) {
    console.error("Error checking user role:", e);
  }
  
  console.log("Diagnostics complete");
}

async function createMeetingRequestsTable() {
  console.log("Attempting to create meeting_requests table...");
  
  if (typeof window.supabase === 'undefined') {
    console.error("Supabase client not found in window object");
    return;
  }
  
  const supabase = window.supabase;
  
  // SQL to create the table
  const sql = `
    CREATE TABLE IF NOT EXISTS public.meeting_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL,
        topic TEXT NOT NULL,
        preferred_time TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        accepted_by UUID,
        scheduled_time TIMESTAMPTZ,
        meet_link TEXT
    );

    -- Enable RLS
    ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Students can create meeting requests" 
    ON public.meeting_requests 
    FOR INSERT 
    WITH CHECK (auth.uid() = student_id);

    CREATE POLICY "Students can view their meeting requests" 
    ON public.meeting_requests 
    FOR SELECT 
    USING (auth.uid() = student_id);

    CREATE POLICY "Mentors can view pending requests" 
    ON public.meeting_requests 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles u 
            WHERE u.id = auth.uid() AND u.role = 'mentor'
        ) 
        AND status = 'pending'
    );

    CREATE POLICY "Mentors can accept pending requests" 
    ON public.meeting_requests 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles u 
            WHERE u.id = auth.uid() AND u.role = 'mentor'
        ) 
        AND status = 'pending'
    );

    CREATE POLICY "Mentors can view accepted requests they've accepted" 
    ON public.meeting_requests 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles u 
            WHERE u.id = auth.uid() AND u.role = 'mentor'
        ) 
        AND accepted_by = auth.uid()
    );

    CREATE POLICY "Admin can view all meeting requests" 
    ON public.meeting_requests 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles u 
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );
  `;

  try {
    // This will only work if the user has admin privileges
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql });
    
    if (error) {
      console.error("Failed to create table:", error);
      console.log("You may not have admin privileges");
    } else {
      console.log("Table created successfully!");
    }
  } catch (e) {
    console.error("Error creating table:", e);
  }
}

// Make functions available globally
window.diagnoseMeetingRequests = diagnoseMeetingRequests;
window.createMeetingRequestsTable = createMeetingRequestsTable;

console.log("Meeting requests diagnostic tools loaded");
console.log("Run window.diagnoseMeetingRequests() to diagnose issues");
console.log("Run window.createMeetingRequestsTable() to attempt to create the table (admin only)");