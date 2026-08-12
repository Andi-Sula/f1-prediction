import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 }
      );
    }

    // Get user profile from our users table
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profile && profile.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Account is not active. Please verify your email." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
      user: profile
        ? {
            id: profile.id,
            username: profile.username,
            email: profile.email,
            name: profile.name,
            surname: profile.surname,
            role: profile.role,
            status: profile.status,
            points: profile.points || 0,
            rank: profile.rank,
            authProvider: profile.auth_provider,
            initials: ((profile.name || "")[0] + (profile.surname || "")[0]).toUpperCase() || "U",
          }
        : null,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
