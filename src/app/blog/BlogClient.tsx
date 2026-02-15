"use client"
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Article, ArticleCard } from "@/components/blog/article-card";
import { 
  Search, 
  TrendingUp,
  ArrowRight,
  Tag,
  Star,
  Loader2
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Background } from "@/components/shared/Background";
import { CaptchaTurnstile } from "@/components/shared/CaptchaTurnstile";

interface DbCategory {
  id: string;
  name: string;
  slug: string;
}

interface NewsletterResponse {
  message: string;
  alreadySubscribed?: boolean;
}

export default function BlogClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"latest" | "trending" | "popular">("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [email, setEmail] = useState("");
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const requireCaptcha = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const [newsletterCaptcha, setNewsletterCaptcha] = useState<string | null>(null);
  const [hp, setHp] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewFilter, setViewFilter] = useState<"all" | "featured" | "trending">("all");
  const mainRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError("");

        // Fetch first page of articles with server pagination
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("limit", String(limit));
        if (searchQuery) params.set("search", searchQuery);
        const articlesResponse = await fetch(`/api/articles?${params.toString()}`);
        if (articlesResponse.ok) {
          const articlesData = await articlesResponse.json();
          setArticles(articlesData.articles);
          const { page: p, pages } = articlesData.pagination || { page: 1, pages: 1 };
          setPage(p);
          setHasMore(p < pages);
          setVisibleCount(articlesData.articles?.length || 0);
        } else {
          setError("Failed to fetch articles");
        }

        // Fetch categories
        const categoriesResponse = await fetch("/api/categories");
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // React to search and category changes
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("limit", String(limit));
        if (searchQuery) params.set("search", searchQuery);
        const categorySlug = selectedCategory === "All" ? undefined : categories.find(c => c.name === selectedCategory)?.slug;
        if (categorySlug) params.set("category", categorySlug);
        const res = await fetch(`/api/articles?${params.toString()}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setArticles(data.articles);
          const { page: p, pages } = data.pagination || { page: 1, pages: 1 };
          setPage(p);
          setHasMore(p < pages);
          setVisibleCount(data.articles?.length || 0);
        }
      } finally {
        setIsLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [searchQuery, selectedCategory, categories, limit]);

  // Debounced search input
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Initialize view filter from URL
  useEffect(() => {
    const v = (searchParams?.get("view") || "all") as "all" | "featured" | "trending";
    setViewFilter(["featured", "trending"].includes(v) ? v : "all");
  }, [searchParams]);

  // Note: subscription state is now checked on-demand via /api/newsletter/status after subscribe

  const categoryOptions = ["All", ...categories.map(cat => cat.name)];

  const filteredArticles = articles.filter(article => {
    const matchCategory = selectedCategory === "All" || article.category === selectedCategory;
    const matchSearch = !searchQuery || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) || 
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const viewFiltered = filteredArticles.filter(a => {
    return viewFilter === "all" ? true : viewFilter === "featured" ? a.featured : a.trending;
  });
  const sortedArticles = [...viewFiltered].sort((a, b) => {
    switch (sortBy) {
      case "trending":
        return b.trending === a.trending ? 0 : b.trending ? 1 : -1;
      case "popular":
        return b.likes - a.likes;
      default:
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    }
  });

  const featuredArticles = useMemo(() => articles.filter(article => article.featured), [articles]);
  const trendingArticles = useMemo(() => articles.filter(article => article.trending), [articles]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as "latest" | "trending" | "popular");
  };
    
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative">
        <Background>
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge variant="secondary" className="mb-4">
                AB TECH
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Read. Learn. Build.
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Latest technology news, how‑tos, and deep dives from AB TECH writers and engineers.
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search articles, topics, or authors..."
                  className="pl-12 h-12 text-base"
                  value={searchInput}
                  onChange={handleSearch}
                />
              </div>
            </motion.div>
          </div>
        </Background>
      </section>

      {error && (
      <section className="mx-auto max-w-4xl px-4 py-8">
          <div className="text-center">
            <div className="text-red-500 mb-4">⚠️ Error loading content</div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </section>
      )}

      {/* Featured Articles */}
      {featuredArticles.length > 0 && (
        <section className="pt-24">
          <div className="mx-auto max-w-5xl px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Badge variant="outline" className="mb-2">
                    <Star className="w-3 h-3 mr-1" />
                    Editor's Choice
                  </Badge>
                  <h2 className="text-2xl font-bold">Featured Articles</h2>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  router.push("/blog?view=featured");
                  setViewFilter("featured");
                  setTimeout(() => mainRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
                }}>
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <ArticleCard article={article} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Trending Articles */}
      {trendingArticles.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mx-auto pt-24"
        >
          <div className="mx-auto max-w-5xl px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Badge variant="outline" className="mb-2">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Trending Now
                </Badge>
                <h2 className="text-2xl font-bold">Trending Articles</h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                router.push("/blog?view=trending");
                setViewFilter("trending");
                setTimeout(() => mainRef.current?.scrollIntoView({ behavior: "smooth" }), 10);
              }}>
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <ArticleCard article={article} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Main Content */}
      <section className="py-24" id="blog-main" ref={mainRef}>
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid lg:grid-cols-4 gap-8">
  
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-8">
                {/* Categories */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Tag className="mr-2 h-5 w-5" />
                        Categories
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {categoryOptions.map((category) => {
                          const count = category === "All" 
                            ? articles.length 
                            : articles.filter(a => a.category === category).length;
                          
                          return (
                            <button
                              key={category}
                              onClick={() => handleCategorySelect(category)}
                              className={`flex items-center justify-between w-full p-2 rounded-lg transition-colors ${
                                selectedCategory === category
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted/50"
                              }`}
                            >
                              <span className="text-sm">{category}</span>
                              <Badge variant="secondary" className="text-xs">
                                {count}
                              </Badge>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Popular Tags */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <TrendingUp className="mr-2 h-5 w-5" />
                        Popular Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(
                          new Set(articles.flatMap(article => article.tags))
                        )
                        .slice(0, 15)
                        .map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="hover:bg-primary hover:text-primary-foreground cursor-pointer"
                            onClick={() => setSearchInput(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>

            {/* Main Articles */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold">
                    {selectedCategory === "All" ? "All Articles" : selectedCategory + " Articles"}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({sortedArticles.length} article{sortedArticles.length !== 1 ? 's' : ''})
                    </span>
                  </h2>
                  <div className="flex items-center space-x-2">
                    <select 
                      className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                      value={sortBy}
                      onChange={handleSortChange}
                    >
                      <option value="latest">Newest First</option>
                      <option value="trending">Trending</option>
                      <option value="popular">Most Popular</option>
                    </select>
                  </div>
                </div>

                {sortedArticles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {sortedArticles.slice(0, visibleCount).map((article, index) => (
                      <motion.div
                        key={article.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: (index % 9) * 0.05 }}
                      >
                        <ArticleCard article={article} variant="default" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? `No articles found for "${searchQuery}"`
                        : `No articles found in ${selectedCategory} category`
                      }
                    </p>
                    {(searchQuery || selectedCategory !== "All") && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("All");
                        }}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                )}

                {/* Load More - server pagination aware */}
                {(hasMore || sortedArticles.length > visibleCount) && (
                  <div className="mt-12 text-center">
                    <Button
                      variant="outline"
                      size="lg"
                      disabled={isLoadingMore}
                      onClick={async () => {
                        // Prefer server-side next page when available
                        if (hasMore) {
                          try {
                            setIsLoadingMore(true);
                            const params = new URLSearchParams();
                            params.set("page", String(page + 1));
                            params.set("limit", String(limit));
                            if (searchQuery) params.set("search", searchQuery);
                            const categorySlug = selectedCategory === "All" ? undefined : categories.find(c => c.name === selectedCategory)?.slug;
                            if (categorySlug) params.set("category", categorySlug);
                            const res = await fetch(`/api/articles?${params.toString()}`);
                            if (res.ok) {
                              const data = await res.json();
                              setArticles(prev => [...prev, ...data.articles]);
                              const { page: p, pages } = data.pagination || { page: page + 1, pages: page + 1 };
                              setPage(p);
                              setHasMore(p < pages);
                              setVisibleCount(prev => prev + (data.articles?.length || 0));
                            }
                          } finally {
                            setIsLoadingMore(false);
                          }
                        } else {
                          // Fallback to client-side load more
                          setVisibleCount(c => c + 9);
                        }
                      }}
                    >
                      {isLoadingMore ? "Loading..." : "Load More Articles"}
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}