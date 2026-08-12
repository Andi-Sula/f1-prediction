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
    const { name, date, race_time, qualifying_time, status } = await request.json();
    if (!name || !date) {
      return NextResponse.json({ success: false, message: "Name and date are required" }, { status: 400 });
    }

    // Validate qualifying is before race
    if (qualifying_time && race_time) {
      if (new Date(qualifying_time).getTime() >= new Date(race_time).getTime()) {
        return NextResponse.json({
          success: false,
          message: "Qualifying date & time must be before race date & time"
        }, { status: 400 });
      }
    }

    // Validate no date conflicts with other events
    if (qualifying_time || race_time) {
      const toDateStr = (v: string) => v.split("T")[0];

      const thisDates = new Set<string>();
      if (qualifying_time) thisDates.add(toDateStr(qualifying_time));
      if (race_time) thisDates.add(toDateStr(race_time));

      if (thisDates.size > 0) {
        const { data: otherRaces } = await supabaseAdmin
          .from("races")
          .select("id, name, qualifying_time, race_time");

        if (otherRaces) {
          for (const other of otherRaces) {
            const otherDates: { date: string; type: string }[] = [];
            if (other.qualifying_time) otherDates.push({ date: toDateStr(other.qualifying_time), type: "qualifying" });
            if (other.race_time) otherDates.push({ date: toDateStr(other.race_time), type: "racing" });

            for (const d of otherDates) {
              if (thisDates.has(d.date)) {
                return NextResponse.json({
                  success: false,
                  message: `This ${d.type} date conflicts with ${other.name}`
                }, { status: 400 });
              }
            }
          }
        }
      }
    }

    const { data, error: dbError } = await supabaseAdmin
      .from("races")
      .insert({ name, date, race_time: race_time || null, qualifying_time: qualifying_time || null, status: status || "upcoming" })
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
    const { id, name, date, race_time, qualifying_time, status } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: "Race ID is required" }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (date !== undefined) updates.date = date;
    if (race_time !== undefined) updates.race_time = race_time;
    if (qualifying_time !== undefined) updates.qualifying_time = qualifying_time;
    if (status !== undefined) updates.status = status;

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
