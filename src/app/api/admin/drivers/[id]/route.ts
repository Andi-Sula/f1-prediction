import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  const { id } = await params;

  try {
    const { code, name, team, number, origin, active } = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (code !== undefined) updates.code = code.toUpperCase();
    if (name !== undefined) updates.name = name;
    if (team !== undefined) updates.team = team;
    if (number !== undefined) updates.number = parseInt(number, 10);
    if (origin !== undefined) updates.origin = origin;
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  const { id } = await params;

  try {
    const { error: dbError } = await supabaseAdmin
      .from("drivers")
      .delete()
      .eq("id", id);
    if (dbError) throw dbError;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to delete driver" }, { status: 500 });
  }
}
