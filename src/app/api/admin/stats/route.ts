import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get total articles count
    const totalArticles = await db.article.count({
      where: { published: true },
    });

    // Get total users count
    const totalUsers = await db.user.count();

    // Get total views
    const totalViews = await db.article.aggregate({
      _sum: { views: true },
      where: { published: true },
    });

    // Get recent articles
    const recentArticles = await db.article.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        views: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      totalArticles,
      totalUsers,
      totalViews: totalViews._sum.views || 0,
      recentArticles,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}