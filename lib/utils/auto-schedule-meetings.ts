import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Auto-schedules 8 monthly meetings for a student with their assigned mentor
 * @param supabase Supabase client instance
 * @param studentId The student's ID
 * @param mentorId The mentor's ID
 * @returns Object containing success status and message
 */
export async function autoScheduleMeetings(
  supabase: SupabaseClient,
  studentId: string,
  mentorId: string
) {
  try {
    // Check if meetings already exist for this student this month
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    const { data: existingMeetings, error: checkError } = await supabase
      .from('meetings')
      .select('id')
      .eq('student_id', studentId)
      .gte('meeting_time', firstDayOfMonth.toISOString())
      .lte('meeting_time', lastDayOfMonth.toISOString())
    
    if (checkError) {
      console.error('Error checking existing meetings:', checkError)
      return { success: false, message: 'Failed to check existing meetings' }
    }
    
    // If meetings already exist for this month, don't create new ones
    if (existingMeetings && existingMeetings.length > 0) {
      return { 
        success: true, 
        message: `${existingMeetings.length} meetings already scheduled for this month` 
      }
    }
    
    // Create 8 meetings spread throughout the month
    const baseDate = new Date(today)
    // Start from tomorrow
    baseDate.setDate(baseDate.getDate() + 1)
    
    // Calculate interval between meetings to spread them across the month
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const interval = Math.floor(daysInMonth / 8)
    
    // Generate meeting times
    const meetings = Array.from({ length: 8 }).map((_, i) => {
      const meetingDate = new Date(baseDate)
      meetingDate.setDate(baseDate.getDate() + (i * interval))
      
      // Set meeting time to a reasonable hour (e.g., 3:00 PM)
      meetingDate.setHours(15, 0, 0, 0)
      
      return {
        student_id: studentId,
        mentor_id: mentorId,
        meeting_time: meetingDate.toISOString(),
        status: 'scheduled',
        type: 'auto',
        join_url: `https://meet.google.com/auto-${studentId.substring(0, 4)}-${i}`,
        created_at: new Date().toISOString()
      }
    })
    
    // Insert meetings into the database
    const { data, error } = await supabase
      .from('meetings')
      .insert(meetings)
      .select()
    
    if (error) {
      console.error('Error scheduling meetings:', error)
      return { success: false, message: 'Failed to schedule meetings' }
    }
    
    return { 
      success: true, 
      message: `Successfully scheduled ${meetings.length} meetings`,
      data
    }
  } catch (error) {
    console.error('Error in autoScheduleMeetings:', error)
    return { success: false, message: 'An unexpected error occurred' }
  }
}