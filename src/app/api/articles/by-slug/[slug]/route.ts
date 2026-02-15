import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import redis, { redisConfigured } from "@/lib/redis";
import { randomUUID } from "node:crypto";

const parseBool = (v: string | undefined) => /^(1|true|yes|on)$/i.test(String(v || ""));

function monthKeyUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}${m}`;
}

function secondsUntilNextMonthUTC(d = new Date()) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const next = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0));
  const seconds = Math.ceil((next.getTime() - d.getTime()) / 1000);
  return Math.max(60, seconds);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    const role = String(session?.user?.role ?? "ANONYMOUS");

    const article = await db.article.findUnique({
      where: { slug },
      include: {
        // Needed for access control (author can view their own drafts/premium)
        author: { select: { id: true, name: true, avatar: true } },
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
    });

    if (!article) {
      return NextResponse.json(
        { message: "Article not found" },
        { status: 404 }
      );
    }

    // Draft protection: only ADMIN or the author can view unpublished content
    const isAdmin = role === "ADMIN";
    const isAuthor = role === "AUTHOR" && session?.user?.id && session.user.id === article.author.id;
    if (!article.published && !isAdmin && !isAuthor) {
      return NextResponse.json({ message: "Article not found" }, { status: 404 });
    }

    // Premium protection: do NOT return full content unless user is allowed
    const canReadPremium = isAdmin || role === "PREMIUM_USER" || isAuthor;

    // ---------------------------
    // Server-side monthly view limits (Redis-backed)
    // ---------------------------
    const enforceViewLimits =
      process.env.NODE_ENV === "production"
        ? parseBool(process.env.ENFORCE_VIEW_LIMITS ?? "true")
        : parseBool(process.env.ENFORCE_VIEW_LIMITS ?? "false");

    if (enforceViewLimits && process.env.NODE_ENV === "production" && !redisConfigured) {
      return NextResponse.json(
        { message: "Service unavailable (Redis not configured for view limits)" },
        { status: 503 }
      );
    }

    const monthlyLimit =
      role === "PREMIUM_USER" || role === "ADMIN"
        ? -1
        : role === "FREE_USER" || role === "AUTHOR"
          ? 15
          : 3;

    // Only apply view limits when we would otherwise return content
    // (don't count premium-locked reads)
    let viewsThisMonth: number | null = null;
    let remainingArticles: number | null = null;

    // anon id cookie for non-authenticated users
    const existingAnonId = request.cookies.get("anon_id")?.value;
    const anonId = existingAnonId || randomUUID();
    const identityKey = session?.user?.id ? `user:${session.user.id}` : `anon:${anonId}`;
    const viewsKey = `views:${identityKey}:${monthKeyUTC()}`;

    if (enforceViewLimits && monthlyLimit !== -1) {
      const rawViews = await redis.get(viewsKey);
      viewsThisMonth = rawViews ? Number(rawViews) : 0;

      if (Number.isFinite(viewsThisMonth) && viewsThisMonth >= monthlyLimit) {
        const response = NextResponse.json({
          id: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          content: "",
          author: { name: article.author.name, avatar: article.author.avatar },
          publishedAt: article.publishedAt || article.createdAt,
          updatedAt: article.updatedAt,
          category: article.category?.name || "Uncategorized",
          tags: article.tags.map((t) => t.tag.name),
          readTime: article.readTime,
          likes: article._count.likes,
          comments: article._count.comments,
          featured: article.featured,
          trending: article.trending,
          coverImage: article.coverImage,
          isPremium: article.premium,
          locked: true,
          lockReason: role === "FREE_USER" || role === "AUTHOR" ? "upgrade_required" : "limit_reached",
          monthlyLimit,
          viewsThisMonth,
          remainingArticles: 0,
        });

        if (!existingAnonId && !session?.user?.id) {
          response.cookies.set("anon_id", anonId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 365 * 24 * 60 * 60,
            path: "/",
          });
        }

        return response;
      }
    }

    // Premium lock check (after view-limit check so limit messaging wins when exceeded)
    const premiumLocked = Boolean(article.premium) && !canReadPremium;
    const lockReason =
      premiumLocked
        ? role === "ANONYMOUS"
          ? "authentication_required"
          : "premium_required"
        : "none";

    // If user can read content, increment server-side view count and sync cookie
    let updatedViewsThisMonth: number | null = viewsThisMonth;
    if (enforceViewLimits && monthlyLimit !== -1 && !premiumLocked) {
      updatedViewsThisMonth = await redis.incr(viewsKey);
      const ttl = await redis.ttl(viewsKey);
      if (ttl < 0) {
        await redis.expire(viewsKey, secondsUntilNextMonthUTC());
      }
      remainingArticles = Math.max(0, monthlyLimit - updatedViewsThisMonth);
    } else if (monthlyLimit !== -1) {
      // if not enforcing or premium locked, best-effort compute remaining from cookie client-side
      remainingArticles = null;
    }

    // Transform the article to match the expected format
    const transformedArticle = {
      id: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      content: canReadPremium || !article.premium ? article.content : "",
      author: {
        name: article.author.name,
        avatar: article.author.avatar,
      },
      publishedAt: article.publishedAt || article.createdAt,
      updatedAt: article.updatedAt,
      category: article.category?.name || "Uncategorized",
      tags: article.tags.map(t => t.tag.name),
      readTime: article.readTime,
      likes: article._count.likes,
      comments: article._count.comments,
      featured: article.featured,
      trending: article.trending,
      coverImage: article.coverImage,
      isPremium: article.premium,
      locked: premiumLocked,
      lockReason,
      monthlyLimit: enforceViewLimits ? monthlyLimit : null,
      viewsThisMonth: enforceViewLimits ? updatedViewsThisMonth : null,
      remainingArticles: enforceViewLimits ? remainingArticles : null,
    };

    const response = NextResponse.json(transformedArticle);

    // Ensure anon id cookie exists for anonymous tracking
    if (!existingAnonId && !session?.user?.id) {
      response.cookies.set("anon_id", anonId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 365 * 24 * 60 * 60,
        path: "/",
      });
    }

    // Sync client cookie with server truth for UI indicators
    if (enforceViewLimits && monthlyLimit !== -1 && updatedViewsThisMonth != null && Number.isFinite(updatedViewsThisMonth)) {
      response.cookies.set("article_views", String(updatedViewsThisMonth), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Error fetching article by slug:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}