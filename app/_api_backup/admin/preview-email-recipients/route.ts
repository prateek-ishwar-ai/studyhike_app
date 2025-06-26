import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { target } = body;

    // Validate the request
    if (!target) {
      return NextResponse.json(
        { message: "Target role is required" },
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
        { message: "Only admins can access this endpoint" },
        { status: 403 }
      );
    }

    // Get emails for the target role
    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("email")
      .eq("role", target);

    if (usersError) {
      return NextResponse.json(
        { message: `Failed to fetch ${target} emails: ${usersError.message}` },
        { status: 500 }
      );
    }

    // Filter out null emails and extract the email addresses
    const emails = users
      ?.filter(user => user.email)
      .map(user => user.email) || [];

    return NextResponse.json({
      recipients: emails,
      count: emails.length,
    });
  } catch (error) {
    console.error("Error fetching email recipients:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}