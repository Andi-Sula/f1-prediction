import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  try {
    const { data, error: dbError } = await supabaseAdmin
      .from("races")
      .select("*")
      .order("date", { ascending: true });
    if (dbError) throw dbError;
    return NextResponse.json({ success: true, races: data });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to fetch races" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  try {
    const { name, date, qualifying_time, status, last_quali_time } = await request.json();
    if (!name || !date) {
      return NextResponse.json({ success: false, message: "Name and date are required" }, { status: 400 });
    }

    const { data, error: dbError } = await supabaseAdmin
      .from("races")
      .insert({ name, date, qualifying_time: qualifying_time || null, status: status || "upcoming", last_quali_time: last_quali_time || null })
      .select()
      .single();
    if (dbError) throw dbError;
    return NextResponse.json({ success: true, race: data });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to create race" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  try {
    const { id, name, date, qualifying_time, status, last_quali_time } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: "Race ID is required" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (date !== undefined) updates.date = date;
    if (qualifying_time !== undefined) updates.qualifying_time = qualifying_time;
    if (last_quali_time !== undefined) updates.last_quali_time = last_quali_time;
    if (status !== undefined) {
      updates.status = status;
      updates.locked = status !== "upcoming";
    }

    const { data, error: dbError } = await supabaseAdmin
      .from("races")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (dbError) throw dbError;
    return NextResponse.json({ success: true, race: data });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update race" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: "Race ID is required" }, { status: 400 });

    const { error: dbError } = await supabaseAdmin.from("races").delete().eq("id", id);
    if (dbError) throw dbError;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to delete race" }, { status: 500 });
  }
}
