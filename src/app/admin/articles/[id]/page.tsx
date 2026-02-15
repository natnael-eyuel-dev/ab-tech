"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/shared/icons";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Edit, Eye, Trash2 } from "lucide-react";
import PageHero from "@/components/shared/PageHero";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
  featured: boolean;
  trending: boolean;
  premium: boolean;
  readTime: number;
  views: number;
  coverImage?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  _count: {
    comments: number;
    likes: number;
  };
}

export default function AdminArticlePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [article, setArticle] = useState<Article | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "AUTHOR")) {
      router.push("/");
      return;
    }

    fetchArticle();
  }, [session, status, router, params.id]);

  const fetchArticle = async () => {
    try {
      const response = await fetch(`/api/articles/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setArticle(data);
      } else {
        setError("Article not found");
      }
    } catch (error) {
      console.error("Failed to fetch article:", error);
      setError("Failed to load article");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!article) return;

    if (!confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Article deleted",
          description: "The article has been deleted successfully.",
        });
        router.push("/admin");
      } else {
        setError("Failed to delete article");
      }
    } catch (error) {
      console.error("Failed to delete article:", error);
      setError("Failed to delete article");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "AUTHOR")) {
    return null;
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>{error || "Article not found"}</AlertDescription>
          </Alert>
          <Button className="mt-4" onClick={() => router.push("/admin")}>
            Back to Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        title="Article Details"
        subtitle="Manage your article"
        badge="Admin"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(`/article/${article.slug}`, "_blank")}>
              <Eye className="h-4 w-4 mr-2" /> View
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push(`/admin/articles/${article.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && (<Icons.spinner className="mr-2 h-4 w-4 animate-spin" />)}
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>
        }
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Article Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{article.title}</span>
                <div className="flex items-center space-x-2">
                  {article.featured && (
                    <Badge variant="secondary">Featured</Badge>
                  )}
                  {article.trending && (
                    <Badge variant="secondary">Trending</Badge>
                  )}
                  {article.premium && (
                    <Badge variant="secondary">Premium</Badge>
                  )}
                  <Badge variant={article.published ? "default" : "secondary"}>
                    {article.published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>
                Slug: {article.slug}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Excerpt</h4>
                <p className="text-sm text-muted-foreground">{article.excerpt}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Author</h4>
                  <p className="text-sm text-muted-foreground">{article.author.name}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Category</h4>
                  <p className="text-sm text-muted-foreground">
                    {article.category?.name || "Uncategorized"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Read Time</h4>
                  <p className="text-sm text-muted-foreground">{article.readTime} min</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Views</h4>
                  <p className="text-sm text-muted-foreground">{article.views}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Engagement</h4>
                  <p className="text-sm text-muted-foreground">
                    {article._count.likes} likes, {article._count.comments} comments
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Created</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(article.createdAt)}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Published</h4>
                  <p className="text-sm text-muted-foreground">
                    {article.publishedAt ? formatDate(article.publishedAt) : "Not published"}
                  </p>
                </div>
              </div>

              {article.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map(({ tag }) => (
                      <Badge key={tag.id} variant="outline">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Content Preview</CardTitle>
              <CardDescription>
                First 500 characters of the article content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm text-muted-foreground">
                  {article.content.substring(0, 500)}
                  {article.content.length > 500 && "..."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cover Image */}
          {article.coverImage && (
            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full max-h-64 object-cover rounded-lg"
                />
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}