import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { email, adminKey } = body;

    // Validate request
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check admin key (this is a simple security check)
    // In production, you'd want a more secure method
    const validAdminKey = process.env.ADMIN_VERIFICATION_KEY;
    if (!adminKey || adminKey !== validAdminKey) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Initialize Supabase admin client
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key needed for admin operations
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Find the user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (userError || !userData?.user) {
      return NextResponse.json(
        { error: userError?.message || "User not found" },
        { status: 404 }
      );
    }

    // Update user to verified status if not already verified
    if (!userData.user.email_confirmed_at) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userData.user.id,
        {
          email_confirm: true,
          user_metadata: {
            ...userData.user.user_metadata,
            email_verified: true,
          }
        }
      );

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    }

    // Check if user has a profile, create one if not
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (!profileData) {
      // Get the role from user metadata
      const role = userData.user.user_metadata?.role || "student";
      const fullName = userData.user.user_metadata?.full_name || email.split("@")[0];

      // Create profile
      await supabaseAdmin.from("profiles").insert({
        id: userData.user.id,
        email: email,
        full_name: fullName,
        role: role,
      });

      // Create role-specific record if needed
      if (role === "student") {
        await supabaseAdmin.from("students").insert({ id: userData.user.id });
      } else if (role === "mentor") {
        await supabaseAdmin.from("mentors").insert({ id: userData.user.id });
      }
    }

    return NextResponse.json({
      success: true,
      message: "User verified successfully",
    });
  } catch (error: any) {
    console.error("Error verifying user:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}