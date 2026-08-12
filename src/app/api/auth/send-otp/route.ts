import { NextRequest, NextResponse } from "next/server";
import { generateOTP, sendOTP, storeOTP } from "@/lib/otp";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
    }

    const otp = generateOTP();
    storeOTP(email, otp);
    await sendOTP(email, otp);

    return NextResponse.json({ success: true, message: "OTP sent to your email." });
  } catch {
    return NextResponse.json({ success: false, message: "Failed to send OTP." }, { status: 500 });
  }
}
