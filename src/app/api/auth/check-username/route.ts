import { NextRequest, NextResponse } from "next/server";
import { getUserByUsername } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    if (!username || typeof username !== "string") {
      return NextResponse.json({ success: false, message: "Username is required" }, { status: 400 });
    }
    const existing = await getUserByUsername(username.trim());
    return NextResponse.json({ success: true, available: !existing });
  } catch {
    return NextResponse.json({ success: false, message: "Check failed" }, { status: 500 });
  }
}
