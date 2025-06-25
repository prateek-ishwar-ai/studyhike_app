import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import nodemailer from 'nodemailer';

// Create a test account using Ethereal for development
// In production, you would use your actual SMTP credentials
async function createTestAccount() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (error) {
    console.error('Failed to create test account:', error);
    throw error;
  }
}

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

    // Create a transporter
    const transporter = await createTestAccount();

    // Send emails to all recipients
    const results = [];
    for (const email of emailRecipients) {
      try {
        // Send mail with defined transport object
        const info = await transporter.sendMail({
          from: '"StudyHike Admin" <admin@studyhike.com>',
          to: email,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
                <h1 style="color: #333; margin-top: 0;">${subject}</h1>
                <div style="background-color: white; padding: 20px; border-radius: 5px;">
                  ${message}
                </div>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">
                  This email was sent from StudyHike. Please do not reply to this email.
                </p>
              </div>
            </div>
          `,
        });

        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        
        results.push({
          email,
          success: true,
          message: 'Email sent successfully',
          previewUrl: nodemailer.getTestMessageUrl(info)
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
      results,
    });
  } catch (error) {
    console.error("Error sending emails:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}