import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

const DIGITALB_API_URL = "https://extservices.digitalb.tv:9381";

export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: error }, { status: 401 });
  }

  try {
    const { usernameOrSc } = await request.json();

    if (!usernameOrSc || typeof usernameOrSc !== "string" || usernameOrSc.trim().length < 3) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid DigitAlb username or smart card number" },
        { status: 400 }
      );
    }

    const sanitized = usernameOrSc.trim();

    const res = await fetch(`${DIGITALB_API_URL}/IsActiveClient`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernameOrSc: sanitized }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: "Unable to reach DigitAlb service" },
        { status: 502 }
      );
    }

    const data: { IsActive: boolean; HasError: boolean; ErrorMessage: string } = await res.json();

    if (data.HasError) {
      return NextResponse.json(
        { success: false, message: data.ErrorMessage || "DigitAlb verification failed" },
        { status: 400 }
      );
    }

    if (!data.IsActive) {
      return NextResponse.json(
        { success: false, message: "This DigitAlb account does not have an active subscription" },
        { status: 400 }
      );
    }

    // Active client — save to user profile
    await supabaseAdmin
      .from("users")
      .update({ digitalb_id: sanitized, digitalb_active: true, digitalb_uses_left: 3 })
      .eq("id", user.id);

    return NextResponse.json({
      success: true,
      message: "DigitAlb account linked successfully",
      digitalbActive: true,
      digitalbUsesLeft: 3,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to verify DigitAlb account" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: error }, { status: 401 });
  }

  await supabaseAdmin
    .from("users")
    .update({ digitalb_id: null, digitalb_active: false, digitalb_uses_left: 3 })
    .eq("id", user.id);

  return NextResponse.json({ success: true, message: "DigitAlb account unlinked" });
}
