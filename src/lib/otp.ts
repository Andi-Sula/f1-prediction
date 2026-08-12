import crypto from "crypto";
import nodemailer from "nodemailer";

// In-memory OTP store (works in serverless with short TTL)
const otpStore = new Map<string, { otp: string; createdAt: number; attempts: number }>();

function createTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

export function generateOTP(): string {
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0);
  return String(num % 100000000).padStart(8, "0");
}

export async function sendOTP(email: string, otp: string): Promise<boolean> {
  console.log(`\n========================================`);
  console.log(`  OTP for ${email}: ${otp}`);
  console.log(`========================================\n`);

  const transporter = createTransporter();
  if (!transporter) return true;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"F1 Predictor" <noreply@f1predictor.com>',
      to: email,
      subject: "Your F1 Predictor Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #E10600; margin: 0;">F1 Predictor</h1>
            <p style="color: #666; font-size: 14px;">Geek Room</p>
          </div>
          <div style="background: #f8f8f8; border-radius: 12px; padding: 24px; text-align: center;">
            <p style="color: #333; font-size: 16px; margin: 0 0 16px;">Your verification code is:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #E10600; font-family: monospace;">
              ${otp}
            </div>
            <p style="color: #999; font-size: 12px; margin: 16px 0 0;">This code expires in 10 minutes.</p>
          </div>
          <p style="color: #999; font-size: 11px; text-align: center; margin-top: 24px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("[OTP] Failed to send email:", (err as Error).message);
    return false;
  }
}

export function storeOTP(email: string, otp: string): void {
  const normalizedEmail = email.toLowerCase().trim();
  otpStore.set(normalizedEmail, {
    otp,
    createdAt: Date.now(),
    attempts: 0,
  });

  setTimeout(() => {
    otpStore.delete(normalizedEmail);
  }, 10 * 60 * 1000);
}

export function verifyOTP(email: string, inputOtp: string): { valid: boolean; message?: string } {
  const normalizedEmail = email.toLowerCase().trim();
  const stored = otpStore.get(normalizedEmail);

  if (!stored) {
    return { valid: false, message: "OTP expired or not found. Please request a new one." };
  }

  if (stored.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    return { valid: false, message: "Too many failed attempts. Please request a new OTP." };
  }

  stored.attempts++;

  if (Date.now() - stored.createdAt > 10 * 60 * 1000) {
    otpStore.delete(normalizedEmail);
    return { valid: false, message: "OTP has expired. Please request a new one." };
  }

  const inputBuffer = Buffer.from(inputOtp.padStart(8, "0"));
  const storedBuffer = Buffer.from(stored.otp);

  if (inputBuffer.length !== storedBuffer.length || !crypto.timingSafeEqual(inputBuffer, storedBuffer)) {
    return { valid: false, message: "Invalid OTP. Please try again." };
  }

  otpStore.delete(normalizedEmail);
  return { valid: true };
}
