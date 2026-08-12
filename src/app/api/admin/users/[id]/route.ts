import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth";
import { updateUser } from "@/lib/database";

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
    const { name, surname, username, email, points, status, role } = await request.json();
    const updates: Record<string, string | number | undefined> = {};
    if (name !== undefined) updates.name = name;
    if (surname !== undefined) updates.surname = surname;
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (points !== undefined) updates.points = points;
    if (status !== undefined) updates.status = status;
    if (role !== undefined) updates.role = role;

    const updated = await updateUser(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, user: updated });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update user" }, { status: 500 });
  }
}
