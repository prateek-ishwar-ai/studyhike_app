import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { 
  sendMentorAssignmentToStudent, 
  sendStudentAssignmentToMentor 
} from '@/lib/email/resend'

// API endpoint to send notifications when students are assigned to mentors
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { assignmentId, studentId, mentorId } = await request.json()
    
    if ((!assignmentId && (!studentId || !mentorId))) {
      return NextResponse.json(
        { error: 'Missing required parameters. Either assignmentId or both studentId and mentorId must be provided.' },
        { status: 400 }
      )
    }
    
    let student, mentor
    
    // If assignmentId is provided, fetch the assignment details
    if (assignmentId) {
      // Try to get from assigned_students table first
      const { data: assignment, error: assignmentError } = await supabase
        .from('assigned_students')
        .select(`
          id,
          student_id,
          mentor_id,
          student:student_id(full_name, email),
          mentor:mentor_id(full_name, email)
        `)
        .eq('id', assignmentId)
        .single()
      
      if (assignmentError || !assignment) {
        // Try the older student_mentor_assignments table
        const { data: oldAssignment, error: oldAssignmentError } = await supabase
          .from('student_mentor_assignments')
          .select(`
            id,
            student_id,
            mentor_id,
            student:student_id(full_name, email),
            mentor:mentor_id(full_name, email)
          `)
          .eq('id', assignmentId)
          .single()
        
        if (oldAssignmentError || !oldAssignment) {
          return NextResponse.json(
            { error: 'Assignment not found' },
            { status: 404 }
          )
        }
        
        student = oldAssignment.student
        mentor = oldAssignment.mentor
      } else {
        student = assignment.student
        mentor = assignment.mentor
      }
    } else {
      // If studentId and mentorId are provided directly, fetch their details
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', studentId)
        .single()
      
      if (studentError || !studentData) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        )
      }
      
      const { data: mentorData, error: mentorError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', mentorId)
        .single()
      
      if (mentorError || !mentorData) {
        return NextResponse.json(
          { error: 'Mentor not found' },
          { status: 404 }
        )
      }
      
      student = studentData
      mentor = mentorData
    }
    
    if (!student?.email || !mentor?.email) {
      return NextResponse.json(
        { error: 'Student or mentor email not found' },
        { status: 400 }
      )
    }
    
    // Send emails to both student and mentor
    const studentEmailResult = await sendMentorAssignmentToStudent(
      student.email,
      student.full_name || 'Student',
      mentor.full_name || 'Mentor'
    )
    
    const mentorEmailResult = await sendStudentAssignmentToMentor(
      mentor.email,
      mentor.full_name || 'Mentor',
      student.full_name || 'Student'
    )
    
    return NextResponse.json({
      success: true,
      message: `${student.full_name} has been assigned to ${mentor.full_name}`,
      emailResults: {
        studentEmail: studentEmailResult,
        mentorEmail: mentorEmailResult
      }
    })
  } catch (error) {
    console.error('Error in assignment notification API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}