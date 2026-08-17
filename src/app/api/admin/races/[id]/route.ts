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
    const { name, date, race_time, qualifying_time, status, visible, best_lap } = await request.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (date !== undefined) updates.date = date;
    if (race_time !== undefined) updates.race_time = race_time;
    if (qualifying_time !== undefined) updates.qualifying_time = qualifying_time;
    if (status !== undefined) updates.status = status;
    if (visible !== undefined) updates.visible = visible;
    if (best_lap !== undefined) updates.best_lap = best_lap || null;

    // Only one event can be in an active status at a time
    if (status && ["qualifying", "waiting_race", "racing"].includes(status)) {
      const { data: activeRace } = await supabaseAdmin
        .from("races")
        .select("id, name")
        .in("status", ["qualifying", "waiting_race", "racing"])
        .neq("id", id)
        .limit(1)
        .single();

      if (activeRace) {
        return NextResponse.json({
          success: false,
          message: `${activeRace.name} is already in an active status`
        }, { status: 400 });
      }
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
      const { data: currentRace } = await supabaseAdmin
        .from("races")
        .select("qualifying_time, race_time")
        .eq("id", id)
        .single();

      const newQuali = qualifying_time || currentRace?.qualifying_time;
      const newRace = race_time || currentRace?.race_time;

      // Extract calendar date without timezone conversion
      const toDateStr = (v: string) => v.split("T")[0];

      const thisDates = new Set<string>();
      if (newQuali) thisDates.add(toDateStr(newQuali));
      if (newRace) thisDates.add(toDateStr(newRace));

      if (thisDates.size > 0) {
        const { data: otherRaces } = await supabaseAdmin
          .from("races")
          .select("id, name, qualifying_time, race_time")
          .neq("id", id);

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
    const { error: dbError } = await supabaseAdmin.from("races").delete().eq("id", id);
    if (dbError) throw dbError;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to delete race" }, { status: 500 });
  }
}
