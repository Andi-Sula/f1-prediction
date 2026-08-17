import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { getUserById } from "@/lib/database";
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
        telephone: user.telephone || "",
        birthday: user.birthday || "",
        role: user.role,
        status: user.status,
        points: user.points || 0,
        rank: rank || 0,
        predictionsCount: count || 0,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
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
    const { name, surname, username, email, telephone, birthday } = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name.trim() || "";
    if (surname !== undefined) updates.surname = surname.trim() || "";
    if (email !== undefined && email.trim()) updates.email = email.trim();
    if (telephone !== undefined) updates.telephone = telephone.trim() || null;
    if (birthday !== undefined) updates.birthday = birthday || null;
    if (username !== undefined && username.trim()) {
      const trimmed = username.trim();
      if (trimmed.length < 3) {
        return NextResponse.json({ success: false, message: "Username must be at least 3 characters" }, { status: 400 });
      }
      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("username", trimmed)
        .neq("id", authUser.id)
        .limit(1)
        .single();
      if (existing) {
        return NextResponse.json({ success: false, message: "Username already taken" }, { status: 400 });
      }
      updates.username = trimmed;
    }

    const { error: dbError } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", authUser.id);
    if (dbError) {
      console.error("[Profile PUT] DB error:", dbError);
      throw dbError;
    }

    return NextResponse.json({ success: true, message: "Profile updated" });
  } catch (err) {
    console.error("[Profile PUT] Error:", err);
    return NextResponse.json({ success: false, message: "Failed to update profile" }, { status: 500 });
  }
}
