import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "./supabase-server";
import { getUserById } from "./database";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  username: string;
}

export async function authenticateRequest(request: NextRequest): Promise<{ user: AuthUser | null; error?: string }> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return { user: null, error: "Access token required" };
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return { user: null, error: "Invalid or expired token" };
    }

    const dbUser = await getUserById(user.id);

    return {
      user: {
        id: user.id,
        email: user.email!,
        role: dbUser?.role || "user",
        username: dbUser?.username || user.user_metadata?.username,
      },
    };
  } catch {
    return { user: null, error: "Authentication failed" };
  }
}

export function requireAuth(user: AuthUser | null): NextResponse | null {
  if (!user) {
    return NextResponse.json({ success: false, message: "Access token required" }, { status: 401 });
  }
  return null;
}

export function requireAdmin(user: AuthUser): NextResponse | null {
  if (user.role !== "admin") {
    return NextResponse.json({ success: false, message: "Admin access required" }, { status: 403 });
  }
  return null;
}
