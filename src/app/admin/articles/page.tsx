"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import PageHero from "@/components/shared/PageHero";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Edit, Eye, ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ManageArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchArticles(1);
  }, []);

  const fetchArticles = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/articles?page=${page}&limit=5`);
      if (!res.ok) throw new Error("Failed to fetch articles");
      const data = await res.json();
      setArticles(data.articles);
      setPagination(data.pagination);
    } catch (err) {
      console.error(err);
      toast({ title: "Error fetching articles" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete article");
      setArticles((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Article deleted" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error deleting article" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        title="Manage Articles"
        subtitle="Create, edit, and publish your blog posts"
        badge="Admin"
        actions={<>
          <Button onClick={() => router.push("/admin/articles/new")} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> New Article
          </Button>
          <Button variant="outline" onClick={() => router.back()}>Back</Button>
        </>}
      />
      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Articles</CardTitle>
              <CardDescription>
                Manage, edit, or delete your blog posts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-muted-foreground">Loading articles...</p>
              ) : articles.length === 0 ? (
                <p className="text-muted-foreground">
                  No articles yet. Add one above.
                </p>
              ) : (
                <div className="divide-y border rounded">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{article.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {article.status === "draft" ? "Draft" : "Published"} •{" "}
                          {new Date(article.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/article/${article.slug}`, "_blank")}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/admin/articles/${article.id}/edit`)
                          }
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete article "{article.title}"?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. The article will
                                be permanently removed.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(article.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => fetchArticles(pagination.page - 1)}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>

                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </p>

                  <Button
                    variant="outline"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => fetchArticles(pagination.page + 1)}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
