import { NextRequest, NextResponse } from "next/server";
import { verifyOTP } from "@/lib/otp";
import { getUserByEmail, updateUser } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();
    if (!email || !otp) {
      return NextResponse.json({ success: false, message: "Email and OTP are required" }, { status: 400 });
    }

    const result = verifyOTP(email, otp);
    if (!result.valid) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (user && user.status === "pending") {
      await updateUser(user.id, { status: "active" });
    }

    return NextResponse.json({ success: true, message: "Email verified successfully" });
  } catch {
    return NextResponse.json({ success: false, message: "Verification failed." }, { status: 500 });
  }
}
