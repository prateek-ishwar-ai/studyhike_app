# Supabase Setup for the E-Learning Platform

This document provides instructions on how to set up Supabase for the E-Learning Platform, including creating the necessary database tables, storage buckets, and authentication settings.

## Prerequisites

1. A Supabase account (free tier is fine for development)
2. Supabase CLI installed (optional but recommended)

## Setup Steps

### 1. Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.io/)
2. Click "New Project"
3. Fill in the project details and create the project

### 2. Set Up Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Database Schema Setup

You can set up the database schema in two ways:

#### Option 1: Using the SQL Editor in Supabase Dashboard

1. Navigate to the SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/migrations/20240701000000_initial_schema.sql` file
3. Paste and execute the SQL script

#### Option 2: Using Supabase CLI (Recommended for Development)

```bash
supabase link --project-ref your-project-ref
supabase migration up
```

### 4. Storage Buckets Setup

Run the storage initialization script to create the necessary storage buckets:

```bash
# Install ts-node if you don't have it
npm install -g ts-node

# Run the initialization script
ts-node lib/supabase/init-storage.ts
```

This will create the following storage buckets:
- `homework_submissions`: For storing homework files submitted by students
- `learning_resources`: For storing educational resources like PDFs, videos, etc.
- `profile_photos`: For storing user profile photos

### 5. Authentication Setup

Configure authentication providers in the Supabase dashboard:

1. Navigate to Authentication > Providers
2. Enable Email provider (default)
3. Optionally, configure other providers like Google, GitHub, etc.
4. Set up email templates for verification, password reset, etc.

### 6. RLS (Row Level Security) Policies

The SQL migration script includes Row Level Security policies that ensure users can only access their own data. These policies are automatically applied when you run the migration script.

### 7. Data Seeding (Optional)

For development purposes, you might want to seed your database with some test data:

```bash
# From the SQL editor, run:
INSERT INTO profiles (id, full_name, role) 
VALUES 
('mentor-uuid', 'Mentor Name', 'mentor'),
('student-uuid', 'Student Name', 'student');

# Add more seed data as needed
```

## Storage Structure

The application uses three main storage buckets:

1. **homework_submissions**: 
   - Path structure: `homework/{user_id}/{homework_id}-{random_string}.{extension}`
   - Access: Private (authenticated access only)

2. **learning_resources**:
   - Path structure: `{subject}/{resource_id}-{filename}.{extension}`
   - Access: Public (read-only)

3. **profile_photos**:
   - Path structure: `{user_id}.{extension}`
   - Access: Public (read-only)

## Important Tables

1. **profiles**: Stores user profile information
2. **students**: Extends profiles with student-specific data
3. **study_plans**: Stores student study plans
4. **tests**: Stores student test results
5. **sessions**: Manages mentor-student sessions
6. **homework**: Stores homework assignments and submissions
7. **mentor_questions**: Stores student questions to mentors
8. **learning_resources**: Stores educational resources

## Troubleshooting

- **RLS Issues**: If you encounter permission errors, check the RLS policies
- **Storage Errors**: Ensure bucket permissions are set correctly
- **Auth Problems**: Verify your environment variables are correct