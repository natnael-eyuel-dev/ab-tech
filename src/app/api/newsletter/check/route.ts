import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }
    const sub = await db.newsletterSubscription.findUnique({ where: { email: email.toLowerCase() } });
    const isSubscribed = !!sub && sub.active;
    return NextResponse.json({ isSubscribed });
  } catch (err) {
    console.error("newsletter.check error", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
