import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("prizes")
      .select("position, published_icon_url, published_label")
      .eq("active", true)
      .order("position", { ascending: true });

    if (error) throw error;
    const prizes = (data || []).map((p: { position: number; published_icon_url: string | null; published_label: string | null }) => ({
      position: p.position,
      icon_url: p.published_icon_url,
      label: p.published_label,
    }));
    return NextResponse.json(prizes);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
