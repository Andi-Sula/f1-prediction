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
    const { role } = await request.json();
    if (!["user", "admin"].includes(role)) {
      return NextResponse.json({ success: false, message: 'Role must be "user" or "admin"' }, { status: 400 });
    }
    const updated = await updateUser(id, { role });
    if (!updated) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, user: updated });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to update user role" }, { status: 500 });
  }
}
