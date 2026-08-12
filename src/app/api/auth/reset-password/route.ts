import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { getUserByEmail } from "@/lib/database";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Email, OTP, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      return NextResponse.json(
        { success: false, message: "Password must contain uppercase, lowercase, number, and special character" },
        { status: 400 }
      );
    }

    const result = verifyOTP(email, otp);
    if (!result.valid) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword });
    if (error) {
      return NextResponse.json({ success: false, message: "Failed to update password" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Password reset successfully. You can now sign in." });
  } catch {
    return NextResponse.json({ success: false, message: "Password reset failed." }, { status: 500 });
  }
}
