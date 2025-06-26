import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { sendEmail } from "@/lib/utils/send-email";

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { recipients, subject, message, directSend = false } = body;

    // Validate the request
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { message: "No recipients provided" },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { message: "Subject is required" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { message: "Message is required" },
        { status: 400 }
      );
    }

    // Check if the user is an admin
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user's role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { message: "Failed to verify admin status" },
        { status: 500 }
      );
    }

    if (profile.role !== "admin") {
      return NextResponse.json(
        { message: "Only admins can send emails" },
        { status: 403 }
      );
    }

    // Process recipients
    let emailRecipients: string[] = [];
    
    if (directSend) {
      // We're sending directly to the provided email addresses
      emailRecipients = recipients;
    } else {
      // Check if we're sending to a group (students or mentors)
      if (recipients.length === 1 && (recipients[0] === "students" || recipients[0] === "mentors")) {
        const targetRole = recipients[0] === "students" ? "student" : "mentor";
        
        // Get emails from profiles table
        const { data: users, error: usersError } = await supabase
          .from("profiles")
          .select("email")
          .eq("role", targetRole);
        
        if (usersError) {
          return NextResponse.json(
            { message: `Failed to fetch ${targetRole} emails: ${usersError.message}` },
            { status: 500 }
          );
        }
        
        if (!users || users.length === 0) {
          return NextResponse.json(
            { message: `No ${targetRole}s found with email addresses` },
            { status: 404 }
          );
        }
        
        emailRecipients = users
          .filter(user => user.email)
          .map(user => user.email);
      } else {
        // We're sending to specific email addresses
        emailRecipients = recipients;
      }
    }
    
    if (emailRecipients.length === 0) {
      return NextResponse.json(
        { message: "No valid recipients found" },
        { status: 400 }
      );
    }

    // Send emails to all recipients
    const results = [];
    console.log(`Attempting to send emails to ${emailRecipients.length} recipients`);
    
    for (const email of emailRecipients) {
      try {
        console.log(`Sending email to: ${email}`);
        const result = await sendEmail({
          to: email,
          subject,
          message,
        });
        
        console.log(`Result for ${email}:`, result);
        
        // For development mode, create a preview link
        let previewUrl = null;
        if (result.mockEmail) {
          // In development, create a data URL to preview the email
          const emailHtml = `
            <html>
              <head>
                <title>Email Preview: ${result.mockEmail.subject}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                  .email-container { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }
                  .email-header { background: #f5f5f5; padding: 15px; border-bottom: 1px solid #ddd; }
                  .email-body { padding: 20px; }
                  .email-footer { background: #f5f5f5; padding: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
                </style>
              </head>
              <body>
                <div class="email-container">
                  <div class="email-header">
                    <strong>To:</strong> ${result.mockEmail.to}<br>
                    <strong>Subject:</strong> ${result.mockEmail.subject}<br>
                    <strong>Sent:</strong> ${result.mockEmail.sentAt}
                  </div>
                  <div class="email-body">
                    ${result.mockEmail.message}
                  </div>
                  <div class="email-footer">
                    This is a preview of an email that would be sent in production.
                  </div>
                </div>
              </body>
            </html>
          `;
          
          // Create a data URL for the preview
          previewUrl = `data:text/html;charset=utf-8,${encodeURIComponent(emailHtml)}`;
        }
        
        results.push({
          email,
          success: result.success,
          message: result.message,
          previewUrl: previewUrl
        });
      } catch (emailError) {
        console.error(`Error sending email to ${email}:`, emailError);
        results.push({
          email,
          success: false,
          message: emailError instanceof Error ? emailError.message : "Failed to send email",
        });
      }
    }

    // Check if any emails failed to send
    const failedEmails = results.filter(result => !result.success);
    
    if (failedEmails.length > 0) {
      return NextResponse.json({
        message: "Some emails failed to send",
        results,
        failedCount: failedEmails.length,
        totalCount: emailRecipients.length,
      }, { status: 207 }); // 207 Multi-Status
    }

    return NextResponse.json({
      message: "All emails sent successfully",
      count: emailRecipients.length,
    });
  } catch (error) {
    console.error("Error sending emails:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}