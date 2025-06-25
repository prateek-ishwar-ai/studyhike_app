# Admin Features Documentation

This document outlines the admin features implemented in the StudyHike platform.

## 1. Admin Login and Access Guard

Admin routes are protected using Supabase Auth and role-based access control:

```typescript
// Implementation in lib/utils/admin-auth.ts
export async function checkAdminAccess(supabase: SupabaseClient) {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  // Get user profile to check role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  // Check if user is an admin
  if (profile.role !== 'admin') {
    redirect('/not-authorized')
  }
  
  return user
}
```

## 2. Meeting Monitoring Feature

### Database Schema

Two main tables are used for meeting management:

#### meetings Table
```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id),
  mentor_id UUID REFERENCES users(id),
  meeting_time TIMESTAMP,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  type TEXT CHECK (type IN ('auto', 'on-request')),
  join_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### meeting_requests Table
```sql
CREATE TABLE meeting_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id),
  mentor_id UUID REFERENCES users(id),
  requested_time TIMESTAMP,
  subject TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Admin Dashboard Features

- View all meetings (past, ongoing, upcoming)
- Filter by student/mentor/date
- View meeting request status (accepted/pending)
- Join ongoing meetings as an observer

## 3. Admin Send Bulk/Personal Emails

Implemented using the Resend API:

```typescript
// Implementation in lib/utils/send-email.ts
export async function sendEmail({
  to,
  subject,
  message
}: {
  to: string | string[];
  subject: string;
  message: string;
}) {
  // Send email using Resend API
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'admin@studyhike.com',
      to: recipients,
      subject,
      html: message
    })
  });
  
  // Process response
}
```

Features:
- Send emails to all students
- Send emails to all mentors
- Send emails to specific users
- Customizable subject and message

## 4. Auto-Schedule Monthly Meetings on First Login

Implemented using a database trigger and utility function:

```typescript
// Implementation in lib/utils/auto-schedule-meetings.ts
export async function autoScheduleMeetings(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
) {
  // Check if meetings already exist for this student this month
  
  // Create 8 meetings spread throughout the month
  const meetings = Array.from({ length: 8 }).map((_, i) => ({
    student_id: studentId,
    mentor_id: mentorId,
    meeting_time: /* calculated date */,
    status: 'scheduled',
    type: 'auto',
    join_url: /* generated URL */,
    created_at: new Date().toISOString()
  }));
  
  // Insert meetings into the database
}
```

Database trigger:
```sql
CREATE OR REPLACE FUNCTION public.auto_schedule_meetings()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if this is a student
  IF NEW.role = 'student' THEN
    -- Schedule 8 meetings, one every 3-4 days
    FOR i IN 1..8 LOOP
      -- Insert meeting
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_schedule_meetings_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_schedule_meetings();
```

## 5. Progress Report Feature (Admin View)

### Database Schema

```sql
CREATE TABLE progress_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id),
  subject TEXT,
  total_tests INTEGER,
  average_score INTEGER,
  completed_homework INTEGER,
  mentor_feedback TEXT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Admin Dashboard Features

- View progress reports by student
- Subject-wise performance
- Test score trends
- Homework completion tracking
- Mentor feedback review

## 6. Permissions & Roles

Role-based access control is implemented using a role column in the users table:

```sql
ALTER TABLE users ADD COLUMN role TEXT CHECK (role IN ('admin', 'mentor', 'student'));
```

Row-level security policies ensure that:
- Admins can view and modify all data
- Mentors can only access data related to their assigned students
- Students can only access their own data

## Implementation Notes

1. All admin features are accessible through the admin dashboard
2. The sidebar navigation provides easy access to all admin features
3. Data is fetched from Supabase in real-time
4. Responsive design ensures usability on all devices
5. Error handling and loading states are implemented for all features