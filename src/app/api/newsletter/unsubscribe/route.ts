import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const { email, captchaToken, honeypot } = await req.json();
    if (honeypot && String(honeypot).trim().length > 0) {
      return NextResponse.json({ message: "Spam detected" }, { status: 400 });
    }
    // Captcha removed for newsletter flows
    // Resolve target subscription by email (if valid) or by authenticated session
    let existing = null as null | { email: string; active: boolean };
    if (email && isValidEmail(email)) {
      existing = await db.newsletterSubscription.findUnique({ where: { email: email.toLowerCase() } });
    } else {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        existing = await db.newsletterSubscription.findUnique({ where: { userId: session.user.id } });
      }
    }
    if (!existing) {
      return NextResponse.json({ message: "Not subscribed" }, { status: 404 });
    }
    if (!existing.active) {
      return NextResponse.json({ message: "Already unsubscribed" }, { status: 200 });
    }
    await db.newsletterSubscription.update({ where: { email: existing.email.toLowerCase() }, data: { active: false } });
    return NextResponse.json({ message: "Unsubscribed" }, { status: 200 });
  } catch (err) {
    console.error("newsletter.unsubscribe error", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
