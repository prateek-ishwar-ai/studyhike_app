# Meeting Requests Feature Setup

## Issue: Database Table Not Created

The meeting requests feature requires a new database table that needs to be created in your Supabase database. The error you're seeing is because the application is trying to access a table that doesn't exist yet.

## Diagnostic Information

When you visit the meeting requests page, you'll now see detailed diagnostic information that can help identify the exact issue. This includes:

- Whether the Supabase client is initialized
- Your authentication status
- Whether the meeting_requests table exists
- Your permissions to select from and insert into the table
- Your user role

## Solution Options

There are several ways to fix this issue:

### Option 1: Use the Admin Interface (Recommended)

1. Log in as an admin user
2. Navigate to "Database Setup" in the admin sidebar
3. Click the "Create Table Now" button
4. Wait for confirmation that the table was created successfully

### Option 2: Run the Migration Script

1. Make sure your Supabase CLI is installed and configured
2. Run the migration script:

```bash
supabase migration up
```

This will apply all pending migrations, including the one that creates the meeting_requests table.

### Option 3: Manual SQL Execution

If you don't have the Supabase CLI set up, you can manually create the table:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Paste the following SQL:

```sql
-- Create meeting_requests table
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
-- Students can create meeting requests
CREATE POLICY "Students can create meeting requests" 
ON public.meeting_requests 
FOR INSERT 
WITH CHECK (auth.uid() = student_id);

-- Students can view their meeting requests
CREATE POLICY "Students can view their meeting requests" 
ON public.meeting_requests 
FOR SELECT 
USING (auth.uid() = student_id);

-- Mentors can view pending requests
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

-- Mentors can accept pending requests
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

-- Mentors can view accepted requests they've accepted
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

-- Admin can view all meeting requests
CREATE POLICY "Admin can view all meeting requests" 
ON public.meeting_requests 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles u 
        WHERE u.id = auth.uid() AND u.role = 'admin'
    )
);
```

5. Run the query
6. Verify that the table was created successfully

### Option 4: Browser Console Method

For advanced users, you can use the browser console to diagnose and fix the issue:

1. Open your browser's developer tools (F12 or right-click > Inspect)
2. Go to the Console tab
3. Load the script by entering:
   ```javascript
   const script = document.createElement('script');
   script.src = '/scripts/fix-meeting-requests.js';
   document.head.appendChild(script);
   ```
4. Run the diagnostic function:
   ```javascript
   window.diagnoseMeetingRequests();
   ```
5. If you have admin privileges, you can try to create the table:
   ```javascript
   window.createMeetingRequestsTable();
   ```

## Verification

After creating the table, you can verify that it's working by:

1. Going to the Meeting Requests page as a student
2. Creating a new meeting request
3. Checking that it appears in the list of pending requests

## Troubleshooting

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Use the diagnostic information on the meeting requests page
3. Verify that the RLS policies are correctly set up
4. Make sure the user has the correct role (student or mentor) in the profiles table
5. Check that the Supabase client is properly initialized with the correct URL and API key

## Common Issues

### "Error fetching meeting requests: {}"

This generic error usually means one of the following:

1. The meeting_requests table doesn't exist
2. You don't have permission to access the table
3. There's an issue with the RLS policies

Use the diagnostic information to determine the exact cause.

### "Failed to create table: permission denied"

This means you don't have admin privileges in the database. You'll need to:

1. Log in as an admin user
2. Use the Database Setup page in the admin interface
3. Or run the SQL manually in the Supabase dashboard

For additional help, please contact the development team.