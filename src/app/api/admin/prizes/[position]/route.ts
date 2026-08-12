import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ position: string }> }
) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  const { position } = await params;
  const pos = parseInt(position, 10);
  if (pos < 1 || pos > 3) {
    return NextResponse.json({ success: false, message: "Position must be 1, 2, or 3" }, { status: 400 });
  }

  try {
    const { icon_url, label } = await request.json();
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
