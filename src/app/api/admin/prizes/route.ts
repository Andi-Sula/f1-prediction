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
      .from("prizes")
      .select("id, position, label, icon_url, published_label, published_icon_url, active")
      .order("position", { ascending: true });
    if (dbError) throw dbError;
    return NextResponse.json({ success: true, prizes: data });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to fetch prizes" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  try {
    const { position, icon_url, label } = await request.json();
    const pos = parseInt(position, 10);
    if (pos < 1 || pos > 3) {
      return NextResponse.json({ success: false, message: "Position must be 1, 2, or 3" }, { status: 400 });
    }
    if (!label) {
      return NextResponse.json({ success: false, message: "Prize name (label) is required" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = { label, updated_at: new Date().toISOString() };
    if (icon_url !== undefined) updates.icon_url = icon_url;

    const { data, error: dbError } = await supabaseAdmin
      .from("prizes")
      .update(updates)
      .eq("position", pos)
      .select()
      .single();
    if (dbError) throw dbError;
    return NextResponse.json({ success: true, prize: data });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update prize" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  try {
    // Publish prizes (copy draft to published)
    const { data: prizes, error: fetchErr } = await supabaseAdmin
      .from("prizes")
      .select("position, label, icon_url")
      .order("position", { ascending: true });
    if (fetchErr) throw fetchErr;

    for (const prize of prizes || []) {
      const { error: updateErr } = await supabaseAdmin
        .from("prizes")
        .update({ published_label: prize.label, published_icon_url: prize.icon_url, updated_at: new Date().toISOString() })
        .eq("position", prize.position);
      if (updateErr) throw updateErr;
    }

    return NextResponse.json({ success: true, message: "Prizes published successfully" });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to publish prizes" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  try {
    // Discard draft: revert draft fields to published values
    const { data: prizes, error: fetchErr } = await supabaseAdmin
      .from("prizes")
      .select("position, published_label, published_icon_url")
      .order("position", { ascending: true });
    if (fetchErr) throw fetchErr;

    for (const prize of prizes || []) {
      const { error: updateErr } = await supabaseAdmin
        .from("prizes")
        .update({ label: prize.published_label, icon_url: prize.published_icon_url, updated_at: new Date().toISOString() })
        .eq("position", prize.position);
      if (updateErr) throw updateErr;
    }

    return NextResponse.json({ success: true, message: "Draft discarded" });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to discard draft" }, { status: 500 });
  }
}
