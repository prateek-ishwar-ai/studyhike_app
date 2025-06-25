/**
 * Utility function to send emails using Resend API
 * @param to Recipient email or array of emails
 * @param subject Email subject
 * @param message Email body (HTML)
 * @returns Object containing success status and message
 */
export async function sendEmail({
  to,
  subject,
  message
}: {
  to: string | string[];
  subject: string;
  message: string;
}) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.RESEND_API_KEY || process.env.NEXT_PUBLIC_RESEND_API_KEY || 'mock_api_key_for_development';
    
    console.log('Email API Key available:', apiKey !== 'mock_api_key_for_development');
    
    if (!apiKey || apiKey === 'mock_api_key_for_development') {
      console.warn('Using mock API key for Resend. Emails will not be sent in development mode.');
      
      // For development, create a more realistic mock response
      // This will help with debugging
      return {
        success: true,
        message: 'Email sent successfully (DEVELOPMENT MODE)',
        recipients: Array.isArray(to) ? to : [to],
        mockEmail: {
          to: Array.isArray(to) ? to : [to],
          subject,
          message,
          sentAt: new Date().toISOString()
        }
      };
    }
    
    // Format recipients
    const recipients = Array.isArray(to) ? to : [to];
    
    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'admin@studyhike.com',
        to: recipients,
        subject,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
            <h1 style="color: #333; margin-top: 0;">${subject}</h1>
            <div style="background-color: white; padding: 20px; border-radius: 5px;">
              ${message}
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              This email was sent from StudyHike. Please do not reply to this email.
            </p>
          </div>
        </div>`
      })
    });
    
    // Check if the response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // Not JSON, likely an error page
      const text = await response.text();
      console.error("Non-JSON response from Resend API:", text);
      throw new Error(`Failed to send email: Server returned non-JSON response`);
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to send email: ${errorData.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      message: 'Email sent successfully',
      data,
      recipients
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send email',
      recipients: Array.isArray(to) ? to : [to]
    };
  }
}