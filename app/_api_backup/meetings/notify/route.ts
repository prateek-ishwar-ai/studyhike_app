import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { 
  sendMeetingConfirmationToStudent, 
  sendMeetingConfirmationToMentor 
} from '@/lib/email/resend'

// API endpoint to send notifications when meetings are confirmed or updated
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { meetingId, action } = await request.json()
    
    if (!meetingId || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }
    
    // Get the meeting details
    const { data: meeting, error: meetingError } = await supabase
      .from('meeting_requests')
      .select(`
        id,
        student_id,
        mentor_id,
        topic,
        description,
        status,
        proposed_date,
        proposed_time,
        scheduled_time,
        meeting_link,
        student:student_id(full_name, email),
        mentor:mentor_id(full_name, email)
      `)
      .eq('id', meetingId)
      .single()
    
    if (meetingError || !meeting) {
      console.error('Error fetching meeting details:', meetingError)
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }
    
    // Format meeting details for email
    const meetingDetails = {
      topic: meeting.topic || 'Discussion',
      date: new Date(meeting.scheduled_time || meeting.proposed_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: meeting.proposed_time || 'To be determined',
      link: meeting.meeting_link || undefined
    }

    // Get student and mentor information
    const studentEmail = meeting.student?.email
    const mentorEmail = meeting.mentor?.email
    const studentName = meeting.student?.full_name || 'Student'
    const mentorName = meeting.mentor?.full_name || 'Mentor'

    let message = ''
    let emailResults = { studentEmail: null, mentorEmail: null }
    
    switch (action) {
      case 'confirmed':
        message = `Meeting "${meeting.topic}" has been confirmed for ${meetingDetails.date} at ${meetingDetails.time}`
        
        // Send confirmation emails to both student and mentor
        if (studentEmail && mentorEmail) {
          emailResults.studentEmail = await sendMeetingConfirmationToStudent(
            studentEmail,
            studentName,
            mentorName,
            meetingDetails
          )
          
          emailResults.mentorEmail = await sendMeetingConfirmationToMentor(
            mentorEmail,
            mentorName,
            studentName,
            meetingDetails
          )
        }
        break
        
      case 'rejected':
        message = `Meeting "${meeting.topic}" has been rejected`
        // Could implement rejection emails here
        break
        
      default:
        message = `Meeting "${meeting.topic}" has been updated`
    }
    
    return NextResponse.json({
      success: true,
      message,
      meeting,
      emailResults
    })
  } catch (error) {
    console.error('Error in meeting notification API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}