# SQL Function Syntax Fixes

## Issues
1. We encountered syntax errors in our PostgreSQL functions due to incorrect ordering of function attributes. Specifically, the `security definer` attribute was placed after the `language` attribute, which is not allowed in PostgreSQL.

2. We also encountered errors with existing policies and functions when trying to create them again, resulting in conflicts.

## Fixes Applied
We've corrected the order of attributes in all SQL functions:

1. `assign_student_to_mentor` function
2. `remove_student_assignment` function
3. `get_mentor_students` function
4. `get_student_mentor` function
5. `has_mentor` function

## Correct Syntax Pattern
The correct order for PostgreSQL function attributes is:

```sql
create or replace function function_name(parameters)
returns return_type
security definer  -- Security attributes come before language
language plpgsql
as $$
begin
  -- Function body
end;
$$;
```

## Additional Fixes
We made several additional fixes to ensure smooth migration:

1. Removed duplicate column definitions in the `get_mentor_students` function
2. Removed duplicate column definitions in the `get_student_mentor` function
3. Added `drop policy if exists` statements before creating policies to avoid conflicts
4. Added `drop function if exists` statements before creating functions to ensure clean creation
5. Fixed formatting issues in SQL queries

## Idempotent Migration
We've made the migration script idempotent, meaning it can be run multiple times without causing errors. This is achieved by:

1. Dropping existing policies before creating them
2. Dropping existing functions before creating them
3. Using `create or replace` for functions
4. Using `create table if not exists` for tables
5. Using `create unique index if not exists` for indexes

## Testing
After applying these fixes, the SQL migration should run successfully without conflicts. The functions can be tested through the application's UI by:

1. Assigning students to mentors in the admin interface
2. Viewing assigned mentors in the student dashboard
3. Viewing assigned students in the mentor dashboard

## References
- [PostgreSQL Function Documentation](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Supabase RPC Function Guide](https://supabase.com/docs/guides/database/functions)