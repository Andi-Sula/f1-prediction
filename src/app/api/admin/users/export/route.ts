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
      .from("users")
      .select("name, surname, username, email, address, telephone, status, role, points, created_at")
      .order("created_at", { ascending: true });

    if (dbError) throw dbError;

    const rows = data || [];
    const headers = ["Name", "Surname", "Username", "Email", "Address", "Telephone", "Status", "Role", "Points", "Registered"];
    const csvLines = [
      headers.join(","),
      ...rows.map((u) => [
        `"${(u.name || "").replace(/"/g, '""')}"`,
        `"${(u.surname || "").replace(/"/g, '""')}"`,
        `"${(u.username || "").replace(/"/g, '""')}"`,
        `"${(u.email || "").replace(/"/g, '""')}"`,
        `"${(u.address || "").replace(/"/g, '""')}"`,
        `"${(u.telephone || "").replace(/"/g, '""')}"`,
        u.status,
        u.role,
        u.points || 0,
        u.created_at ? new Date(u.created_at).toLocaleDateString() : "",
      ].join(",")),
    ];

    const csv = "\uFEFF" + csvLines.join("\r\n"); // BOM for Excel UTF-8

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="f1_users_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to export users" }, { status: 500 });
  }
}
