import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

// Vercel has no static IP, so DigitAlb is reached through the geekroom proxy (static IP + IPSec VPN).
const DIGITALB_PROXY_URL = process.env.DIGITALB_PROXY_URL || "https://f1predictor.geekroom.al/digitalb-proxy/";
const DIGITALB_PROXY_TOKEN = process.env.DIGITALB_PROXY_TOKEN;
const SOAP_ACTION = "http://tempuri.org/IsActiveClient";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const attempts = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(userId) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    attempts.set(userId, recent);
    return true;
  }
  recent.push(now);
  attempts.set(userId, recent);
  return false;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, c =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!
  );
}

function readTag(xml: string, tag: string): string | null {
  if (new RegExp(`<${tag}\\s*/>`).test(xml)) return "";
  return xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))?.[1]?.trim() ?? null;
}

export async function POST(request: NextRequest) {
  const { user, error } = await authenticateRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: error }, { status: 401 });
  }

  if (!DIGITALB_PROXY_TOKEN) {
    console.error("[DigitAlb] DIGITALB_PROXY_TOKEN is not configured");
    return NextResponse.json(
      { success: false, message: "DigitAlb verification is temporarily unavailable" },
      { status: 503 }
    );
  }

  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { success: false, message: "Too many verification attempts. Please try again in a few minutes." },
      { status: 429 }
    );
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

    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <IsActiveClient xmlns="http://tempuri.org/">
      <usernameOrSc>${escapeXml(sanitized)}</usernameOrSc>
    </IsActiveClient>
  </soap:Body>
</soap:Envelope>`;

    const res = await fetch(DIGITALB_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: SOAP_ACTION,
        ...(DIGITALB_PROXY_TOKEN ? { Authorization: `Bearer ${DIGITALB_PROXY_TOKEN}` } : {}),
      },
      body: envelope,
      signal: AbortSignal.timeout(10000),
    });

    const xml = await res.text();

    const isActive = readTag(xml, "IsActive");
    const hasError = readTag(xml, "HasError");

    // DigitAlb can return a non-2xx status alongside a valid SOAP envelope,
    // so the body wins whenever it parses.
    if (isActive === null || hasError === null) {
      const faultString = readTag(xml, "faultstring");
      console.error("[DigitAlb] Unusable response. HTTP", res.status, xml.slice(0, 1000));
      return NextResponse.json(
        {
          success: false,
          message: faultString ? "DigitAlb verification failed" : "Unable to reach DigitAlb service",
          debug: `HTTP ${res.status}: ${(faultString ?? xml).slice(0, 800)}`,
        },
        { status: res.status === 429 ? 429 : 502 }
      );
    }

    if (!res.ok) {
      console.error("[DigitAlb] Non-2xx with SOAP body. HTTP", res.status, xml.slice(0, 1000));
    }

    const data = {
      IsActive: isActive === "true",
      HasError: hasError === "true",
      ErrorMessage: readTag(xml, "ErrorMessage") ?? "",
    };

    if (data.HasError) {
      return NextResponse.json(
        {
          success: false,
          message: data.ErrorMessage || "DigitAlb verification failed",
          // TODO: drop `debug` once a successful verification is confirmed
          debug: `HTTP ${res.status}: ${xml.slice(0, 800)}`,
        },
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
  } catch (err) {
    const e = err as Error & { cause?: { code?: string; message?: string } };
    console.error("[DigitAlb] Exception:", e);
    // TODO: drop `debug` once a successful verification is confirmed
    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify DigitAlb account",
        debug: `${e.name}: ${e.message}${e.cause?.code ? ` | cause=${e.cause.code}` : ""}${e.cause?.message ? ` | ${e.cause.message}` : ""}`,
      },
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
