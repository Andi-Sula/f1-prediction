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
      .from("drivers")
      .select("*")
      .order("name", { ascending: true });
    if (dbError) throw dbError;
    return NextResponse.json({ success: true, drivers: data });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to fetch drivers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  try {
    const { code, name, team, number, image_url } = await request.json();
    if (!code || !name || !team || number === undefined) {
      return NextResponse.json({ success: false, message: "Code, name, team, and number are required" }, { status: 400 });
    }
    const { data, error: dbError } = await supabaseAdmin
      .from("drivers")
      .insert({ code: code.toUpperCase(), name, team, number: parseInt(number, 10), image_url: image_url || null, active: true })
      .select()
      .single();
    if (dbError) throw dbError;
    return NextResponse.json({ success: true, driver: data });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to create driver" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  try {
    const { id, code, name, team, number, image_url, active } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: "Driver ID is required" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (code !== undefined) updates.code = code.toUpperCase();
    if (name !== undefined) updates.name = name;
    if (team !== undefined) updates.team = team;
    if (number !== undefined) updates.number = parseInt(number, 10);
    if (image_url !== undefined) updates.image_url = image_url;
    if (active !== undefined) updates.active = active;

    const { data, error: dbError } = await supabaseAdmin
      .from("drivers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    if (dbError) throw dbError;
    return NextResponse.json({ success: true, driver: data });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update driver" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: "Driver ID is required" }, { status: 400 });

    const { data, error: dbError } = await supabaseAdmin
      .from("drivers")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (dbError) throw dbError;
    return NextResponse.json({ success: true, driver: data });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to deactivate driver" }, { status: 500 });
  }
}
