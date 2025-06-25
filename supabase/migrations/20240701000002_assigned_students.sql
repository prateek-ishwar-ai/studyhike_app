-- ========================================
-- Student-Mentor Assignment System
-- ========================================
-- Create a table to map students to mentors
create table if not exists public.assigned_students (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  mentor_id uuid not null,
  assigned_by uuid not null,
  assigned_at timestamp with time zone default timezone('Asia/Kolkata', now()),
  foreign key (student_id) references auth.users(id) on delete cascade,
  foreign key (mentor_id) references auth.users(id) on delete cascade,
  foreign key (assigned_by) references auth.users(id)
);

-- Create a unique constraint so the same student cannot be assigned to the same mentor multiple times
create unique index if not exists unique_student_mentor on public.assigned_students(student_id, mentor_id);

-- Enable Row-Level Security
alter table public.assigned_students enable row level security;

-- Add RLS policies
-- Allow Admin to do everything (drop if exists first to avoid conflicts)
drop policy if exists "Admin can manage all assignments" on public.assigned_students;

create policy "Admin can manage all assignments"
on public.assigned_students
for all
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Allow Mentors to read their assigned students (drop if exists first to avoid conflicts)
drop policy if exists "Mentors can read their students" on public.assigned_students;

create policy "Mentors can read their students"
on public.assigned_students
for select
using (
  auth.uid() = mentor_id
);

-- Create function to assign a student to a mentor (drop if exists to ensure clean creation)
drop function if exists public.assign_student_to_mentor(uuid, uuid);

create or replace function public.assign_student_to_mentor(
  p_student_id uuid,
  p_mentor_id uuid
)
returns json
security definer
language plpgsql
as $$
declare
  v_admin_id uuid;
  v_result json;
begin
  -- Get the admin user ID
  select auth.uid() into v_admin_id;
  
  -- Check if the admin user exists and has admin role
  if not exists (
    select 1 from public.profiles
    where id = v_admin_id and role = 'admin'
  ) then
    return json_build_object(
      'success', false,
      'message', 'Only administrators can assign students to mentors'
    );
  end if;
  
  -- Check if the student exists
  if not exists (
    select 1 from public.profiles
    where id = p_student_id and role = 'student'
  ) then
    return json_build_object(
      'success', false,
      'message', 'Student not found'
    );
  end if;
  
  -- Check if the mentor exists
  if not exists (
    select 1 from public.profiles
    where id = p_mentor_id and role = 'mentor'
  ) then
    return json_build_object(
      'success', false,
      'message', 'Mentor not found'
    );
  end if;
  
  -- Check if the assignment already exists
  if exists (
    select 1 from public.assigned_students
    where student_id = p_student_id and mentor_id = p_mentor_id
  ) then
    return json_build_object(
      'success', false,
      'message', 'This student is already assigned to this mentor'
    );
  end if;
  
  -- Create the assignment
  insert into public.assigned_students (
    student_id,
    mentor_id,
    assigned_by
  )
  values (
    p_student_id,
    p_mentor_id,
    v_admin_id
  )
  returning id into v_result;
  
  return json_build_object(
    'success', true,
    'message', 'Student assigned to mentor successfully',
    'assignment_id', v_result
  );
end;
$$;

-- Create function to remove a student assignment (drop if exists to ensure clean creation)
drop function if exists public.remove_student_assignment(uuid);

create or replace function public.remove_student_assignment(
  p_assignment_id uuid
)
returns json
security definer
language plpgsql
as $$
declare
  v_admin_id uuid;
begin
  -- Get the admin user ID
  select auth.uid() into v_admin_id;
  
  -- Check if the admin user exists and has admin role
  if not exists (
    select 1 from public.profiles
    where id = v_admin_id and role = 'admin'
  ) then
    return json_build_object(
      'success', false,
      'message', 'Only administrators can remove student assignments'
    );
  end if;
  
  -- Check if the assignment exists
  if not exists (
    select 1 from public.assigned_students
    where id = p_assignment_id
  ) then
    return json_build_object(
      'success', false,
      'message', 'Assignment not found'
    );
  end if;
  
  -- Remove the assignment
  delete from public.assigned_students
  where id = p_assignment_id;
  
  return json_build_object(
    'success', true,
    'message', 'Assignment removed successfully'
  );
end;
$$;

-- Create function to get all students assigned to a mentor (drop if exists to ensure clean creation)
drop function if exists public.get_mentor_students(uuid);

create or replace function public.get_mentor_students(
  p_mentor_id uuid
)
returns table (
  assignment_id uuid,
  student_id uuid,
  student_name text,
  student_email text,
  assigned_at timestamptz
)
security definer
language plpgsql
as $$
begin
  -- Check if the user is the mentor or an admin
  if auth.uid() != p_mentor_id and not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) then
    raise exception 'You do not have permission to view these students';
  end if;
  
  return query
  select 
    a.id as assignment_id,
    s.id as student_id,
    s.full_name as student_name,
    u.email as student_email,
    a.assigned_at
  from public.assigned_students a
  join public.profiles s on s.id = a.student_id
  join auth.users u on u.id = s.id
  where a.mentor_id = p_mentor_id
  order by s.full_name;
end;
$$;

-- Create function to get the mentor assigned to a student (drop if exists to ensure clean creation)
drop function if exists public.get_student_mentor(uuid);

create or replace function public.get_student_mentor(
  p_student_id uuid
)
returns table (
  assignment_id uuid,
  mentor_id uuid,
  mentor_name text,
  mentor_email text,
  assigned_at timestamptz
)
security definer
language plpgsql
as $$
begin
  -- Check if the user is the student or an admin or the assigned mentor
  if auth.uid() != p_student_id and not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) and not exists (
    select 1 from public.assigned_students
    where student_id = p_student_id and mentor_id = auth.uid()
  ) then
    raise exception 'You do not have permission to view this information';
  end if;
  
  return query
  select 
    a.id as assignment_id,
    m.id as mentor_id,
    m.full_name as mentor_name,
    u.email as mentor_email
  from public.assigned_students a
  join public.profiles m on m.id = a.mentor_id
  join auth.users u on u.id = m.id
  where a.student_id = p_student_id
  limit 1;
end;
$$;

-- Create a function to check if a student has a mentor (drop if exists to ensure clean creation)
drop function if exists public.has_mentor(uuid);

create or replace function public.has_mentor(
  p_student_id uuid
)
returns boolean
security definer
language plpgsql
as $$
begin
  return exists (
    select 1
    from public.assigned_students
    where student_id = p_student_id
  );
end;
$$;