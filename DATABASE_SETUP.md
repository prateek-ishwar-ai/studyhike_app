# Database Setup Instructions

This document provides instructions on how to set up the necessary database tables and functions for the JEE Mentor application.

## Prerequisites

1. A Supabase account with a project set up
2. Your Supabase URL and API keys

## Setup Steps

### 1. Create a .env.local file

Create a `.env.local` file in the root of your project with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Replace the placeholders with your actual Supabase credentials.

### 2. Run the setup script

Run the following command to set up the database:

```bash
npm run setup-db
```

This script will:

1. Create the necessary tables:
   - `student_mentor_assignments` - Tracks which students are assigned to which mentors
   - `mentor_meeting_requests` - Tracks meeting requests between mentors and students

2. Create the following database functions:
   - `exec_sql` - Allows admins to execute arbitrary SQL (used for setup)
   - `assign_student_to_mentor` - Assigns a student to a mentor
   - `remove_student_assignment` - Removes a student assignment
   - `get_mentor_students` - Gets all students assigned to a mentor

### 3. Restart your application

After running the setup script, restart your Next.js development server:

```bash
npm run dev
```

## Manual Setup (if the script fails)

If the automatic setup script fails, you can manually set up the database by running the SQL commands in the Supabase SQL Editor.

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy and paste the SQL from `scripts/setup-database.js` into the editor
5. Run the query

## Troubleshooting

If you encounter issues with the setup:

1. Check that your Supabase credentials are correct in the `.env.local` file
2. Make sure you have the necessary permissions to create tables and functions
3. Check the console output for specific error messages
4. Try running the SQL commands manually in the Supabase SQL Editor

## Database Schema

### student_mentor_assignments

This table tracks which students are assigned to which mentors.

| Column      | Type        | Description                           |
|-------------|-------------|---------------------------------------|
| id          | UUID        | Primary key                           |
| student_id  | UUID        | Foreign key to profiles.id            |
| mentor_id   | UUID        | Foreign key to profiles.id            |
| assigned_at | TIMESTAMPTZ | When the assignment was created       |

### mentor_meeting_requests

This table tracks meeting requests between mentors and students.

| Column           | Type        | Description                           |
|------------------|-------------|---------------------------------------|
| id               | UUID        | Primary key                           |
| mentor_id        | UUID        | Foreign key to profiles.id            |
| student_id       | UUID        | Foreign key to profiles.id            |
| title            | TEXT        | Meeting title                         |
| description      | TEXT        | Meeting description                   |
| proposed_date    | DATE        | Proposed meeting date                 |
| proposed_time    | TEXT        | Proposed meeting time                 |
| status           | TEXT        | Status (pending/accepted/declined/completed) |
| student_response | TEXT        | Student's response to the request     |
| meeting_link     | TEXT        | Link to the meeting                   |
| created_at       | TIMESTAMPTZ | When the request was created          |
| updated_at       | TIMESTAMPTZ | When the request was last updated     |