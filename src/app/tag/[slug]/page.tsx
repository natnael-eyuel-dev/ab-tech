"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { ArticleCard, type Article } from "@/components/blog/article-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft, Grid, List, Hash } from "lucide-react";
import Link from "next/link";

interface TagPageProps {
  params: any;
  searchParams: any;
}

export default function TagPage({ params, searchParams }: TagPageProps) {
  const tagName = (params?.slug ?? '').replace(/-/g, ' ');
  const [searchQuery, setSearchQuery] = useState(searchParams.search || "");
  const [sortBy, setSortBy] = useState<"latest" | "trending" | "popular">(searchParams.sort || "latest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch articles by tag from API
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiParams = new URLSearchParams();
        apiParams.set("tag", params?.slug ?? '');
        if (searchQuery) apiParams.set("search", searchQuery);
        apiParams.set("limit", "100");

        const response = await fetch(`/api/articles?${apiParams.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch articles");
        
        const data = await response.json();
        let fetchedArticles = data.articles || [];

        // Filter by tag name (client-side since API uses slug)
        fetchedArticles = fetchedArticles.filter((article: Article) =>
          article.tags.some(tag => tag.toLowerCase() === tagName.toLowerCase())
        );

        // Additional client-side search filtering
        if (searchQuery) {
          fetchedArticles = fetchedArticles.filter((article: Article) =>
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setArticles(fetchedArticles);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load articles");
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [params?.slug, tagName, searchQuery]);

  const sortedArticles = [...articles].sort((a, b) => {
    switch (sortBy) {
      case "trending":
        return b.trending === a.trending ? 0 : b.trending ? 1 : -1;
      case "popular":
        return b.likes - a.likes;
      default:
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }
  });

  const tagStats = {
    totalArticles: articles.length,
    totalReads: articles.reduce((sum, article) => sum + article.likes, 0),
    totalComments: articles.reduce((sum, article) => sum + article.comments, 0),
    categories: Array.from(
      new Set(articles.map(article => article.category))
    ),
  };

  // If no articles found for this tag, return 404
  if (!loading && articles.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Tag Header */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-muted/50 py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <Badge variant="secondary" className="mb-4 flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  Tag
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                  #{tagName}
                </h1>
                <p className="text-xl text-muted-foreground mb-6">
                  Explore articles tagged with #{tagName}
                </p>
                
                {/* Tag Stats */}
                <div className="grid grid-cols-3 gap-6 max-w-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {tagStats.totalArticles}
                    </div>
                    <div className="text-sm text-muted-foreground">Articles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {tagStats.totalReads}+
                    </div>
                    <div className="text-sm text-muted-foreground">Reads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {tagStats.totalComments}
                    </div>
                    <div className="text-sm text-muted-foreground">Comments</div>
                  </div>
                </div>
              </div>

              {/* Related Categories */}
              <div className="bg-card p-6 rounded-lg">
                <h3 className="font-semibold mb-3">Related Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {tagStats.categories.map((category) => (
                    <Badge key={category} variant="outline">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Articles Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Search and Filters */}
          <div className="space-y-4 mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search articles with this tag..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {loading ? "Loading..." : `${articles.length} article${articles.length !== 1 ? 's' : ''} found`}
                </span>
                
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="latest">Latest</option>
                  <option value="trending">Trending</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Articles Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading articles...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : sortedArticles.length > 0 ? (
            <div className={
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }>
              {sortedArticles.map((article) => (
                <ArticleCard 
                  key={article.id} 
                  article={article}
                  variant={viewMode === "list" ? "compact" : "default"}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No articles found with tag #{tagName} matching your search criteria.
              </p>
              <Button onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}