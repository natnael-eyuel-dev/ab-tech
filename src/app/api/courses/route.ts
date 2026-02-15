import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const courses = await db.course.findMany({
      where: { status: "PUBLISHED", published: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImage: true,
        level: true,
        views: true,
        createdAt: true,
        modules: {
          select: {
            id: true,
            title: true,
            assets: { select: { id: true } },
          },
        },
      },
    });

    const shaped = courses.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      coverImage: c.coverImage,
      level: c.level,
      views: c.views,
      createdAt: c.createdAt,
      moduleCount: c.modules.length,
      assetCount: c.modules.reduce((sum, m) => sum + m.assets.length, 0),
      moduleTitles: c.modules.slice(0, 2).map((m) => m.title),
    }));

    return NextResponse.json({ courses: shaped });
  } catch (e) {
    console.error("List courses error:", e);
    return NextResponse.json({ courses: [] });
  }
}
