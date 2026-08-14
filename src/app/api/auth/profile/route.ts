import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getUserById, updateUser } from "@/lib/database";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { user: authUser, error } = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ success: false, message: error }, { status: 401 });
  }

  try {
    const user = await getUserById(authUser.id);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Calculate rank
    const { data: allUsers } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("status", "active")
      .neq("role", "admin")
      .order("points", { ascending: false });
    const rank = (allUsers || []).findIndex(u => u.id === user.id) + 1;

    // Count predictions
    const { count } = await supabaseAdmin
      .from("predictions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        surname: user.surname,
        address: user.address || "",
        birthday: user.birthday || "",
        telephone: user.telephone || "",
        role: user.role,
        status: user.status,
        points: user.points || 0,
        rank: rank || 0,
        predictionsCount: count || 0,
        authProvider: user.authProvider,
        themePreference: user.themePreference || 'dark',
        initials: ((user.name || "")[0] + (user.surname || "")[0]).toUpperCase() || "U",
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to get profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { user: authUser, error } = await authenticateRequest(request);
  if (!authUser) {
    return NextResponse.json({ success: false, message: error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const allowed = ["name", "surname", "username", "address", "birthday", "telephone", "themePreference"];
    const updates: Record<string, string | null> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates[key] = body[key] === "" ? null : body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, message: "No valid fields to update" }, { status: 400 });
    }

    if (updates.themePreference && !["dark", "light"].includes(updates.themePreference)) {
      return NextResponse.json({ success: false, message: "Invalid theme preference" }, { status: 400 });
    }

    if (updates.username) {
      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id")
        .ilike("username", updates.username)
        .neq("id", authUser.id)
        .single();
      if (existing) {
        return NextResponse.json({ success: false, message: "Username already taken" }, { status: 409 });
      }
    }

    const updated = await updateUser(authUser.id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ success: false, message: "Failed to update profile" }, { status: 500 });
  }
}
