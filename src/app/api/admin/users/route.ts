import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, requireAdmin } from "@/lib/auth";
import { getAllUsers, updateUser } from "@/lib/database";

export async function GET(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  try {
    const users = await getAllUsers();
    return NextResponse.json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        surname: u.surname,
        username: u.username,
        email: u.email,
        address: u.address,
        birthday: u.birthday,
        telephone: u.telephone,
        role: u.role,
        status: u.status,
        authProvider: u.authProvider,
        points: u.points,
        rank: u.rank,
        predictions: u.predictions,
        createdAt: u.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) return NextResponse.json({ success: false, message: error }, { status: 401 });
  const adminErr = requireAdmin(user);
  if (adminErr) return adminErr;

  try {
    const { id, name, surname, username, email, points, status, role } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });

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
