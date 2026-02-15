import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { createEmailToken } from "@/lib/email-tokens";
import { buildAbsoluteUrl, sendEmail } from "@/lib/email";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const { email, captchaToken, honeypot } = await req.json();
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ message: "Invalid email" }, { status: 400 });
    }
    if (honeypot && String(honeypot).trim().length > 0) {
      return NextResponse.json({ message: "Spam detected" }, { status: 400 });
    }

    // Captcha removed for newsletter flows

    const session = await getServerSession(authOptions);
    const userId = session?.user?.email?.toLowerCase() === email.toLowerCase() ? session?.user?.id : undefined;

    const existing = await db.newsletterSubscription.findUnique({ where: { email: email.toLowerCase() } });

    // Create or update subscription as pending (active=false) until confirmation
    let pending = false;
    if (existing) {
      // If already verified, short-circuit
      if (existing.active) {
        return NextResponse.json({ message: "Already subscribed", alreadySubscribed: true }, { status: 200 });
      }
      // existing but not active -> keep pending
      pending = true;
    } else {
      await db.newsletterSubscription.create({
        data: {
          email: email.toLowerCase(),
          active: false,
          userId,
        },
      });
      pending = true;
    }

    // Create verification token and send confirmation email (does not activate yet)
    try {
      const token = await createEmailToken(email, "newsletter-confirm");
      const url = buildAbsoluteUrl(`/newsletter/confirm?token=${encodeURIComponent(token)}`);
      const html = `
        <div style="font-family:system-ui,Segoe UI,Helvetica,Arial,sans-serif;line-height:1.6;color:#111">
          <h2>Confirm your subscription</h2>
          <p>Thanks for requesting our newsletter. Click the button below to confirm and complete subscription:</p>
          <p><a href="${url}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Confirm subscription</a></p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${url}">${url}</a></p>
        </div>`;
      await sendEmail({ to: email, subject: "Confirm your newsletter subscription", html, text: `Confirm your subscription: ${url}` });
    } catch (e: any) {
      console.warn("[newsletter] Failed to send confirmation email", {
        message: e?.message,
        code: e?.code,
        command: e?.command,
        response: e?.response,
        responseCode: e?.responseCode,
        stack: e?.stack,
      });
    }

    return NextResponse.json({ message: "Check your inbox to confirm your subscription.", pending: pending });
  } catch (err) {
    console.error("newsletter.subscribe error", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
