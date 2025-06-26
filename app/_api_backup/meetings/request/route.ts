import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { mentorId, requestedDay, requestedTime, topic } = await request.json()
    
    // Validate inputs
    if (!mentorId || !requestedDay || !requestedTime || !topic) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Insert the meeting request directly using SQL to bypass RLS issues
    const { data, error } = await supabase.rpc('insert_meeting_request', {
      p_student_id: user.id,
      p_mentor_id: mentorId,
      p_requested_day: requestedDay,
      p_requested_time: requestedTime,
      p_topic: topic
    })
    
    if (error) {
      console.error('Error creating meeting request:', error)
      return NextResponse.json(
        { error: `Failed to create meeting request: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Meeting request created successfully',
      id: data
    })
  } catch (error: any) {
    console.error('Error in meeting request API:', error)
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    )
  }
}