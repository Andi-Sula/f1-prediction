import { NextRequest, NextResponse } from "next/server";
import { generateOTP, sendOTP, storeOTP } from "@/lib/otp";
import { getUserByEmail } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (user) {
      const otp = generateOTP();
      storeOTP(email, otp);
      await sendOTP(email, otp);
    }

    // Don't reveal whether email exists
    return NextResponse.json({ success: true, message: "If an account exists with this email, a reset code has been sent." });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to send reset code." }, { status: 500 });
  }
}
