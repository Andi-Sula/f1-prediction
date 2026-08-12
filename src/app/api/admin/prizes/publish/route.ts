import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  try {
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
