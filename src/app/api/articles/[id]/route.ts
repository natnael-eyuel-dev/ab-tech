import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "AUTHOR")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const article = await db.article.findUnique({
      where: { id },
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
    });

    if (!article) {
      return NextResponse.json(
        { message: "Article not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      premium,
      readTime,
      published,
      tagIds = [],
    } = await request.json();

    const existingArticle = await db.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { message: "Article not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to edit this article
  if (session.user?.role !== "ADMIN" && existingArticle.authorId !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    // Generate new slug if title changed
    let slug = existingArticle.slug;
    if (title && title !== existingArticle.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Check if slug already exists
      const slugExists = await db.article.findFirst({
        where: { 
          slug, 
          id: { not: id }
        },
      });

      if (slugExists) {
        return NextResponse.json(
          { message: "Article with this title already exists" },
          { status: 400 }
        );
      }
    }

    // Update article
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (categoryId !== undefined) updateData.categoryId = categoryId || null;
    if (featured !== undefined) updateData.featured = featured;
    if (trending !== undefined) updateData.trending = trending;
    if (premium !== undefined) updateData.premium = premium;
    if (readTime !== undefined) updateData.readTime = readTime;
    if (published !== undefined) {
      updateData.published = published;
      updateData.publishedAt = published ? new Date() : null;
    }

    // Handle tags update
    if (tagIds !== undefined) {
      // Remove existing tags
      await db.articleTag.deleteMany({
        where: { articleId: id },
      });

      // Add new tags
      if (tagIds.length > 0) {
        updateData.tags = {
          create: tagIds.map((tagId: string) => ({
            tag: {
              connect: { id: tagId },
            },
          })),
        };
      }
    }

    const article = await db.article.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "AUTHOR")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const existingArticle = await db.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { message: "Article not found" },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this article
    if (session.user?.role !== "ADMIN" && existingArticle.authorId !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    // Delete article tags first
    await db.articleTag.deleteMany({
      where: { articleId: id },
    });

    // Delete comments
    await db.comment.deleteMany({
      where: { articleId: id },
    });

    // Delete likes
    await db.like.deleteMany({
      where: { articleId: id },
    });

    // Delete SEO data if exists
    await db.sEO.deleteMany({
      where: { articleId: id },
    });

    // Delete the article
    await db.article.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Article deleted successfully" });
  } catch (error) {
    console.error("Error deleting article:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}