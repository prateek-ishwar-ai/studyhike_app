// Using fetch API directly to call Resend API
// Note: In production, this should be stored in an environment variable
const resendApiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY || 'your_resend_api_key_here';

// Helper function to send emails via Resend API
async function sendEmail(options: {
  from: string;
  to: string[];
  subject: string;
  html: string;
}) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify(options)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send email');
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error sending email:', error);
    return { data: null, error };
  }
}

// Email sender address
const fromEmail = 'notifications@studyhike.com';

/**
 * Send a meeting confirmation email to a student
 * @param to Student's email address
 * @param studentName Student's name
 * @param mentorName Mentor's name
 * @param meetingDetails Meeting details (topic, date, time, link)
 */
export async function sendMeetingConfirmationToStudent(
  to: string,
  studentName: string,
  mentorName: string,
  meetingDetails: {
    topic: string;
    date: string;
    time: string;
    link?: string;
  }
) {
  try {
    const { topic, date, time, link } = meetingDetails;
    
    const { data, error } = await sendEmail({
      from: fromEmail,
      to: [to],
      subject: `Meeting Confirmed: ${topic} with ${mentorName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a6cf7;">Meeting Confirmed</h2>
          <p>Hello ${studentName},</p>
          <p>Your meeting request has been confirmed by your mentor, ${mentorName}.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Meeting Details</h3>
            <p><strong>Topic:</strong> ${topic}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            ${link ? `<p><strong>Meeting Link:</strong> <a href="${link}" target="_blank">${link}</a></p>` : ''}
          </div>
          
          <p>Please make sure to be prepared and join the meeting on time.</p>
          <p>If you need to reschedule, please contact your mentor as soon as possible.</p>
          
          <p style="margin-top: 30px;">Best regards,</p>
          <p>The StudyHike Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending meeting confirmation email to student:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception sending meeting confirmation email to student:', error);
    return { success: false, error };
  }
}

/**
 * Send a meeting confirmation email to a mentor
 * @param to Mentor's email address
 * @param mentorName Mentor's name
 * @param studentName Student's name
 * @param meetingDetails Meeting details (topic, date, time, link)
 */
export async function sendMeetingConfirmationToMentor(
  to: string,
  mentorName: string,
  studentName: string,
  meetingDetails: {
    topic: string;
    date: string;
    time: string;
    link?: string;
  }
) {
  try {
    const { topic, date, time, link } = meetingDetails;
    
    const { data, error } = await sendEmail({
      from: fromEmail,
      to: [to],
      subject: `Meeting Scheduled: ${topic} with ${studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a6cf7;">Meeting Scheduled</h2>
          <p>Hello ${mentorName},</p>
          <p>You have confirmed a meeting with your student, ${studentName}.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Meeting Details</h3>
            <p><strong>Topic:</strong> ${topic}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            ${link ? `<p><strong>Meeting Link:</strong> <a href="${link}" target="_blank">${link}</a></p>` : ''}
          </div>
          
          <p>Please make sure to be prepared and start the meeting on time.</p>
          
          <p style="margin-top: 30px;">Best regards,</p>
          <p>The StudyHike Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending meeting confirmation email to mentor:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception sending meeting confirmation email to mentor:', error);
    return { success: false, error };
  }
}

/**
 * Send a mentor assignment notification to a student
 * @param to Student's email address
 * @param studentName Student's name
 * @param mentorName Mentor's name
 */
export async function sendMentorAssignmentToStudent(
  to: string,
  studentName: string,
  mentorName: string
) {
  try {
    const { data, error } = await sendEmail({
      from: fromEmail,
      to: [to],
      subject: `Your Mentor Has Been Assigned: ${mentorName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a6cf7;">Mentor Assigned</h2>
          <p>Hello ${studentName},</p>
          <p>We're excited to inform you that <strong>${mentorName}</strong> has been assigned as your mentor!</p>
          
          <p>Your mentor will be reaching out to you soon to introduce themselves and discuss your learning goals.</p>
          
          <p>You can now request meetings with your mentor through the StudyHike platform.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Next Steps</h3>
            <ul>
              <li>Log in to your StudyHike account</li>
              <li>Visit your dashboard to see your assigned mentor</li>
              <li>Request a meeting to get started on your learning journey</li>
            </ul>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          
          <p style="margin-top: 30px;">Best regards,</p>
          <p>The StudyHike Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending mentor assignment email to student:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception sending mentor assignment email to student:', error);
    return { success: false, error };
  }
}

/**
 * Send a student assignment notification to a mentor
 * @param to Mentor's email address
 * @param mentorName Mentor's name
 * @param studentName Student's name
 */
export async function sendStudentAssignmentToMentor(
  to: string,
  mentorName: string,
  studentName: string
) {
  try {
    const { data, error } = await sendEmail({
      from: fromEmail,
      to: [to],
      subject: `New Student Assigned: ${studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #4a6cf7;">New Student Assigned</h2>
          <p>Hello ${mentorName},</p>
          <p>We're pleased to inform you that <strong>${studentName}</strong> has been assigned as your student!</p>
          
          <p>We recommend reaching out to your new student soon to introduce yourself and discuss their learning goals.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Next Steps</h3>
            <ul>
              <li>Log in to your StudyHike account</li>
              <li>Visit your dashboard to see your assigned students</li>
              <li>Schedule an introductory meeting with your new student</li>
            </ul>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          
          <p style="margin-top: 30px;">Best regards,</p>
          <p>The StudyHike Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending student assignment email to mentor:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exception sending student assignment email to mentor:', error);
    return { success: false, error };
  }
}