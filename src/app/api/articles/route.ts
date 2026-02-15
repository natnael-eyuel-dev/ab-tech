import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "AUTHOR")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      title,
      excerpt,
      content,
      categoryId,
      featured,
      trending,
      readTime,
      tagIds = [],
    } = await request.json();

    if (!title || !excerpt || !content) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const existingArticle = await db.article.findUnique({
      where: { slug },
    });

    if (existingArticle) {
      return NextResponse.json(
        { message: "Article with this title already exists" },
        { status: 400 }
      );
    }

    // Create article
    const article = await db.article.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        authorId: session.user.id,
        categoryId: categoryId || null,
        featured: featured || false,
        trending: trending || false,
        readTime: readTime || 0,
        published: true,
        publishedAt: new Date(),
        tags: {
          create: tagIds.map((tagId: string) => ({
            tag: {
              connect: { id: tagId },
            },
          })),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    console.error("Error creating article:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Transform database article to ArticleCard format
function transformArticle(dbArticle: any) {
  return {
    slug: dbArticle.slug,
    id: dbArticle.slug, // Use slug for URL
    title: dbArticle.title,
    excerpt: dbArticle.excerpt,
    // Never return full content from the public listing endpoint
    // (full content is served from /api/articles/by-slug/:slug with access checks)
    author: {
      name: dbArticle.author.name,
      avatar: dbArticle.author.avatar,
    },
    publishedAt: dbArticle.publishedAt || dbArticle.createdAt,
    updatedAt: dbArticle.updatedAt,
    category: dbArticle.category?.name || "Uncategorized",
    tags: dbArticle.tags.map((t: any) => t.tag.name),
    readTime: dbArticle.readTime,
    likes: dbArticle._count.likes,
    comments: dbArticle._count.comments,
    featured: dbArticle.featured,
    trending: dbArticle.trending,
    coverImage: dbArticle.coverImage,
    isPremium: dbArticle.premium,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = String(session?.user?.role ?? "ANONYMOUS");
    const isPrivileged = role === "ADMIN" || role === "AUTHOR";

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const requestedPublished = searchParams.get("published");
    const wantDrafts = requestedPublished === "false";
    const exclude = searchParams.get("exclude");
  const authorRole = searchParams.get("authorRole");
  const authorId = searchParams.get("authorId");

    const skip = (page - 1) * limit;

    // Public users should never be able to fetch drafts by passing ?published=false
    const where: any = { published: wantDrafts && isPrivileged ? false : true };
    if (authorId) {
      where.authorId = authorId;
    }
    if (authorRole) {
      where.author = {
        role: authorRole,
      };
    }

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            slug: tag,
          },
        },
      };
    }

    if (search) {
      // Postgres supports mode: "insensitive", but we keep contains-only for compatibility
      const q = search.trim();
      if (q.length > 0) {
        where.OR = [
          { title: { contains: q } },
          { excerpt: { contains: q } },
          { content: { contains: q } },
        ];
      }
    }

    // Exclude specific article by slug
    if (exclude) {
      where.slug = {
        not: exclude,
      };
    }

    const [articles, total] = await Promise.all([
      db.article.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
        orderBy: {
          publishedAt: "desc",
        },
        skip,
        take: limit,
      }),
      db.article.count({ where }),
    ]);

    // Transform articles to match expected format
    const transformedArticles = articles.map((a: any) => {
      const base = transformArticle(a);
      return {
        ...base,
        // include category slug alongside name for richer consumers
        categorySlug: a.category?.slug ?? null,
      };
    });

    return NextResponse.json({
      articles: transformedArticles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}