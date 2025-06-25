# Meeting Request System Implementation

## Overview

This implementation adds a student-initiated meeting request system to the JEE Mentor platform. The system allows:

1. Students to submit meeting requests with topics and optional preferred times
2. Mentors to view all pending requests
3. Mentors to accept requests and schedule meetings
4. Once a mentor accepts a request, it disappears from other mentors' dashboards
5. Students to track the status of their requests

## Database Schema

A new `meeting_requests` table has been added with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Auto-generated |
| student_id | UUID | auth.user.id of student |
| topic | Text | Subject/topic |
| preferred_time | Timestamptz | Optional preferred meeting time |
| status | Text | 'pending', 'accepted' |
| created_at | Timestamptz | now() default |
| accepted_by | UUID | Mentor's user ID if accepted |
| scheduled_time | Timestamptz | Final meeting time decided by mentor |
| meet_link | Text | Google Meet link added by mentor |

## Row-Level Security (RLS) Policies

The following RLS policies have been implemented:

1. Students can create meeting requests
2. Students can view their own meeting requests
3. Mentors can view pending requests
4. Mentors can accept pending requests
5. Mentors can view accepted requests they've accepted
6. Admins can view all meeting requests

## Implementation Details

### Student Flow

1. Students navigate to the Meeting Requests page
2. They fill out a form with:
   - Topic / problem
   - Preferred time (optional)
3. On submission, a new record is created in the `meeting_requests` table with status "pending"
4. Students can view all their requests (both pending and accepted)
5. For accepted requests, students can see:
   - The scheduled time
   - The meeting link
   - The mentor who accepted the request

### Mentor Flow

1. Mentors navigate to the Meeting Requests page
2. They see a list of all pending requests from students
3. When a mentor clicks "Accept & Schedule", they:
   - Set a final meeting time
   - Provide a Google Meet link
4. Once accepted, the request:
   - Is updated with status "accepted"
   - Records the accepting mentor's ID
   - Stores the scheduled time and meeting link
   - Disappears from other mentors' dashboards
5. Mentors can view their upcoming and past accepted meetings

## Files Created/Modified

1. **Database Migration**:
   - `supabase/migrations/20240701000001_meeting_requests.sql`

2. **Type Definitions**:
   - Updated `types/database.ts` to include meeting_requests table

3. **Student Pages**:
   - Created `app/student/meeting-requests/page.tsx`
   - Updated `components/layout/student-sidebar.tsx` to add navigation link

4. **Mentor Pages**:
   - Created `app/mentor/meeting-requests/page.tsx`
   - Updated `components/layout/mentor-sidebar.tsx` to add navigation link

## Usage

1. Students can access the Meeting Requests page from their sidebar
2. Mentors can access the Meeting Requests page from their sidebar
3. The system handles race conditions to ensure only one mentor can accept a request

## Future Enhancements

Potential future enhancements could include:

1. Email notifications when requests are submitted or accepted
2. Calendar integration for scheduling
3. Meeting reminders
4. Post-meeting feedback system
5. Recurring meeting options