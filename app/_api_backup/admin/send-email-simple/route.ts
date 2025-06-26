import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { recipients, subject, message } = body;

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

    // In development, we'll just log the emails instead of sending them
    console.log("Email would be sent to:", recipients);
    console.log("Subject:", subject);
    console.log("Message:", message);

    // Return success
    return NextResponse.json({
      message: "Emails would be sent in production",
      count: recipients.length,
      recipients,
    });
  } catch (error) {
    console.error("Error in send-email-simple:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}