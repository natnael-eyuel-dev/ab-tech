import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consumeEmailToken, verifyEmailToken } from "@/lib/email-tokens";
const debug = /^(1|true|yes|on)$/i.test(String(process.env.SMTP_DEBUG || ""));

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ ok: false, message: "Missing token" }, { status: 400 });

  const res = await verifyEmailToken(token, "newsletter-confirm");
  if (!res.ok) {
    const msg = res.reason === "expired" ? "Token expired" : "Invalid token";
    if (debug) console.warn("[newsletter] confirm failed", { reason: res.reason });
    return NextResponse.json({ ok: false, message: msg }, { status: 400 });
  }
  const email = res.email!;
  await db.newsletterSubscription.upsert({
    where: { email: email.toLowerCase() },
    create: { email: email.toLowerCase(), active: true },
    update: { active: true },
  });
  await consumeEmailToken(token);
  if (debug) console.info("[newsletter] subscription confirmed", { email });
  return NextResponse.json({ ok: true, message: "Subscription confirmed", email });
}
