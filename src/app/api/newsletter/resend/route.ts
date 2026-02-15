import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createEmailToken } from "@/lib/email-tokens";
import { buildAbsoluteUrl, sendEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export async function POST(req: NextRequest) {
  try {
    const { email, captchaToken, honeypot } = await req.json();
    if (honeypot && String(honeypot).trim().length > 0) {
      return NextResponse.json({ message: "Spam detected" }, { status: 400 });
    }
    // Captcha removed for newsletter flows
    // Resolve subscription by provided email or by authenticated session
    let sub = null as any;
    if (email) {
      sub = await db.newsletterSubscription.findUnique({ where: { email: email.toLowerCase() } });
    } else {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        sub = await db.newsletterSubscription.findUnique({ where: { userId: session.user.id } });
      }
    }
    if (!sub) return NextResponse.json({ message: "No pending subscription found" }, { status: 404 });
    if (sub.active) return NextResponse.json({ message: "Already subscribed" }, { status: 200 });

  const targetEmail = (sub?.email || email || "").toLowerCase();
  if (!targetEmail) return NextResponse.json({ message: "No email found for subscription" }, { status: 400 });
  const token = await createEmailToken(targetEmail, "newsletter-confirm");
  const url = buildAbsoluteUrl(`/newsletter/confirm?token=${encodeURIComponent(token)}`);
    const html = `
      <div style="font-family:system-ui,Segoe UI,Helvetica,Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Confirm your subscription</h2>
        <p>Click the button below to confirm and complete subscription:</p>
        <p><a href="${url}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Confirm subscription</a></p>
      </div>`;
  await sendEmail({ to: targetEmail, subject: "Confirm your newsletter subscription", html, text: `Confirm your subscription: ${url}` });
    return NextResponse.json({ message: "Verification email resent" });
  } catch (err) {
    console.error("newsletter.resend error", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
