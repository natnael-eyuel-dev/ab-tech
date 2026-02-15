import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    // If user is authenticated, try to resolve by session->userId
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const sub = await db.newsletterSubscription.findUnique({ where: { userId: session.user.id } });
      if (sub) {
        const status = sub.active ? "verified" : "pending";
        return NextResponse.json({ status });
      }
      return NextResponse.json({ status: "none" });
    }

    if (!email) return NextResponse.json({ status: "none" });
    const sub = await db.newsletterSubscription.findUnique({ where: { email: email.toLowerCase() } });
    const status = !sub ? "none" : sub.active ? "verified" : "pending";
    return NextResponse.json({ status });
  } catch (err) {
    console.error("newsletter.status error", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
