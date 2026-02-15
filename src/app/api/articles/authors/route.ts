import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/articles/authors?published=true
// Returns list of authors who have at least one article (optionally filtered by published flag)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publishedParam = searchParams.get("published");
    const published = publishedParam == null ? undefined : publishedParam === "true";

    const where: any = {};
    if (typeof published === "boolean") {
      where.published = published;
    }

    const rows = await db.article.findMany({
      where,
      select: {
        authorId: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const counts = new Map<string, { id: string; name: string | null; count: number }>();
    for (const r of rows) {
      if (!r.authorId) continue;
      const key = String(r.authorId);
      const current = counts.get(key) || { id: key, name: r.author?.name ?? null, count: 0 };
      current.count += 1;
      if (!current.name && r.author?.name) current.name = r.author.name;
      counts.set(key, current);
    }

    const authors = Array.from(counts.values())
      .filter((a) => a.count > 0)
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      .map((a) => ({ id: a.id, name: a.name || "Unknown", count: a.count }));

    return NextResponse.json(authors);
  } catch (error) {
    console.error("Error fetching authors:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
