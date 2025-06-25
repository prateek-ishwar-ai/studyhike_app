// Test script for meeting_requests table
import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testMeetingRequests() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials not found in environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Check if the table exists by trying to select from it
    console.log('Testing if meeting_requests table exists...');
    const { data: tableData, error: tableError } = await supabase
      .from('meeting_requests')
      .select('id')
      .limit(1);

    if (tableError) {
      console.error('Error accessing meeting_requests table:', tableError);
      return;
    }

    console.log('meeting_requests table exists!');
    console.log('Sample data:', tableData);

    // Test RLS policies by trying to insert a record
    console.log('\nTesting insert into meeting_requests...');
    
    // First, get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      console.log('Please sign in before running this test');
      return;
    }

    console.log('Current user ID:', user.id);

    // Try to insert a test record
    const { data: insertData, error: insertError } = await supabase
      .from('meeting_requests')
      .insert({
        student_id: user.id,
        topic: 'Test meeting request',
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting into meeting_requests:', insertError);
      return;
    }

    console.log('Successfully inserted test record:');
    console.log(insertData);

    // Clean up by deleting the test record
    console.log('\nCleaning up test data...');
    const { error: deleteError } = await supabase
      .from('meeting_requests')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.error('Error deleting test record:', deleteError);
      return;
    }

    console.log('Test record deleted successfully');
    console.log('\nAll tests passed!');
  } catch (error) {
    console.error('Unexpected error during testing:', error);
  }
}

testMeetingRequests();