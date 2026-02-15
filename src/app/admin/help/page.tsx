"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHero from '@/components/shared/PageHero'
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

// Data shapes (updated to focus on links for category articles and videos)
type HelpCategoryArticle = { title: string; link?: string };
type HelpCategory = { title: string; description?: string; articles: HelpCategoryArticle[] };
type PopularArticle = { title: string; category: string; views?: string; link?: string };
type VideoTutorial = { title: string; duration: string; link?: string };

export default function AdminHelpPage() {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<HelpCategory[]>([]);
    const [popular, setPopular] = useState<PopularArticle[]>([]);
    const [videos, setVideos] = useState<VideoTutorial[]>([]);
    // expand/collapse sets
    const [catOpen, setCatOpen] = useState<Set<number>>(new Set());
    const [popOpen, setPopOpen] = useState<Set<number>>(new Set());
    const [vidOpen, setVidOpen] = useState<Set<number>>(new Set());
    // Draft rows (shown only after clicking Add)
    const [catDrafts, setCatDrafts] = useState<HelpCategory[]>([]);
    const [popDrafts, setPopDrafts] = useState<PopularArticle[]>([]);
  const [vidDrafts, setVidDrafts] = useState<VideoTutorial[]>([]);
    const router = useRouter();
    // Per-field suggestion caches
    const [catArticleSugs, setCatArticleSugs] = useState<Record<string, ArticleSuggestion[]>>({});
  const [popSugs, setPopSugs] = useState<Record<string | number, ArticleSuggestion[]>>({});
  // Track draft article rows inside saved categories so they don't get numbered until saved
  const [catArticleDraftIdx, setCatArticleDraftIdx] = useState<Record<number, Set<number>>>({});
    const timersRef = useRef<Record<string, any>>({});

    useEffect(() => {
        (async () => {
        try {
            const res = await fetch('/api/help/sections');
            const json = await res.json();
      const normalizedCategories: HelpCategory[] = (json.categories || []).map((c: any) => ({
      title: c?.title ?? '',
      description: c?.description ?? '',
      articles: Array.isArray(c?.articles)
        ? c.articles.map((a: any) => (
          typeof a === 'string'
            ? { title: '', link: a }
            : { title: a?.title ?? '', link: a?.link ?? '' }
          ))
        : [],
      }));
            setCategories(normalizedCategories);
            const normalizedPopular: PopularArticle[] = (json.popularArticles || []).map((p: any) => ({
            title: p?.title ?? '',
            category: p?.category ?? '',
            views: p?.views ?? '',
            link: p?.link ?? '',
            }));
            setPopular(normalizedPopular);
            const normalizedVideos: VideoTutorial[] = (json.videoTutorials || []).map((v: any) => ({
            title: v?.title ?? '',
            duration: v?.duration ?? '',
            link: v?.link ?? '',
            }));
            setVideos(normalizedVideos);
        } catch (e) {
            console.error(e);
        }
        })();
    }, []);

    async function saveItem(key: 'categories' | 'popularArticles' | 'videoTutorials', index: number | undefined, data: any) {
        setLoading(true);
        try {
        const res = await fetch('/api/admin/help/sections', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, index, data })
        });
        if (!res.ok) throw new Error('Failed to save');
        toast({ title: 'Saved' });
        } catch (e: any) {
        toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
        setLoading(false);
        }
    }

    async function deleteItem(key: 'categories' | 'popularArticles' | 'videoTutorials', index: number) {
        setLoading(true);
        try {
        const res = await fetch('/api/admin/help/sections', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, index })
        });
        if (!res.ok) throw new Error('Failed to delete');
        toast({ title: 'Removed' });
        } catch (e: any) {
        toast({ title: 'Error', description: e.message, variant: 'destructive' });
        } finally {
        setLoading(false);
        }
    }

    // --- Article search helper ---
  type ArticleSuggestion = { title: string; slug: string; link: string; category?: string; views?: string };
  function formatViews(n?: number): string | undefined {
    if (typeof n !== 'number') return undefined;
    if (n < 1000) return String(n);
    const k = n / 1000;
    return `${k.toFixed(k >= 10 ? 0 : 1)}K`;
  }
    async function fetchArticleSuggestions(q: string): Promise<ArticleSuggestion[]> {
        if (!q || q.trim().length < 2) return [];
        try {
        const res = await fetch(`/api/articles?search=${encodeURIComponent(q)}&limit=5`);
        if (!res.ok) return [];
        const data = await res.json();
    const list = (data?.articles || []) as Array<{ title: string; slug: string; category?: string; likes?: number; comments?: number }>;
    return list.map(a => ({
      title: a.title,
      slug: a.slug,
      link: `/article/${a.slug}`,
      category: a.category,
      views: formatViews((a.likes ?? 0) + (a.comments ?? 0))
    }));
        } catch { return []; }
    }

    function debouncedSuggest(key: string | number, val: string, target: 'cat' | 'pop') {
        const k = String(key);
        if (timersRef.current[k]) clearTimeout(timersRef.current[k]);
        timersRef.current[k] = setTimeout(async () => {
        const items = await fetchArticleSuggestions(val);
        if (target === 'cat') setCatArticleSugs(prev => ({ ...prev, [k]: items }));
        else setPopSugs(prev => ({ ...prev, [k]: items }));
        }, 300);
    }

    // Small suggestion dropdown component
    function SuggestBox({ items, onPick }: { items: ArticleSuggestion[]; onPick: (s: ArticleSuggestion)=>void }) {
        if (!items.length) return null;
        return (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-sm">
            {items.map((s, i) => (
            <button
                key={`${s.slug}-${i}`}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
                onClick={() => onPick(s)}
            >
                {s.title}
            </button>
            ))}
        </div>
        );
    }

  return (
    <div className="min-h-screen">
    <PageHero
      title="Help Center"
      subtitle="Manage the content that appears on the public Help page."
      badge="Admin"
      actions={<Button variant="outline" onClick={() => router.back()}>Back</Button>}
    />

    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-10">

        {/* Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Categories</CardTitle>
              <Badge variant="secondary">categories</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {categories.map((c, idx) => {
              const open = catOpen.has(idx);
              const number = idx + 1;
              return (
                <div key={idx} className="border rounded-2xl p-4 shadow-sm">
                  {/* Header */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() =>
                      setCatOpen(prev => {
                        const next = new Set(prev);
                        if (next.has(idx)) next.delete(idx);
                        else next.add(idx);
                        return next;
                      })
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="min-w-8 justify-center">
                        #{number}
                      </Badge>
                      <span className="font-medium">{c.title || "Untitled"}</span>
                    </div>
                    {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>

                  {open && (
                    <>
                      {/* Inputs */}
                      <div className="space-y-3 mt-4">
                        <Input
                          placeholder="Title"
                          value={c.title}
                          onChange={e =>
                            setCategories(a => a.map((it, i) => (i === idx ? { ...it, title: e.target.value } : it)))
                          }
                        />

                        <Input
                          placeholder="Description"
                          value={c.description || ""}
                          onChange={e =>
                            setCategories(a => a.map((it, i) => (i === idx ? { ...it, description: e.target.value } : it)))
                          }
                        />

                        {/* Articles (link-first, chosen via title suggestions) */}
                        <div className="space-y-3">
                          {(c.articles || []).map((art, aIdx) => (
                            <div key={aIdx} className="space-y-2">
                              {/* Number badge only for saved (non-draft) rows */}
                              {!(catArticleDraftIdx[idx]?.has(aIdx)) && (
                                <Badge variant="outline" className="min-w-6 h-5 px-2 flex items-center justify-center">#{aIdx + 1}</Badge>
                              )}
                              <div className="relative">
                                <Input
                                  placeholder="Search article title"
                                  value={art.title}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setCategories(a =>
                                      a.map((it, i) =>
                                        i === idx
                                          ? {
                                              ...it,
                                              articles: it.articles.map((ar, j) =>
                                                j === aIdx ? { ...ar, title: val } : ar
                                              ),
                                            }
                                          : it
                                      )
                                    );
                                    debouncedSuggest(`cat:${idx}:${aIdx}`, val, "cat");
                                  }}
                                  onFocus={e => debouncedSuggest(`cat:${idx}:${aIdx}`, e.currentTarget.value, "cat")}
                                />
                                <SuggestBox
                                  items={catArticleSugs[`cat:${idx}:${aIdx}`] || []}
                                  onPick={sel => {
                                    setCategories(a =>
                                      a.map((it, i) =>
                                        i === idx
                                          ? {
                                              ...it,
                                              articles: it.articles.map((ar, j) =>
                                                j === aIdx ? { title: sel.title, link: sel.link } : ar
                                              ),
                                            }
                                          : it
                                      )
                                    );
                                    setCatArticleSugs(p => ({ ...p, [`cat:${idx}:${aIdx}`]: [] }));
                                  }}
                                />
                              </div>
                              <Input
                                placeholder="Link"
                                value={art.link || ""}
                                onChange={e =>
                                  setCategories(a =>
                                    a.map((it, i) =>
                                      i === idx
                                        ? {
                                            ...it,
                                            articles: it.articles.map((ar, j) =>
                                              j === aIdx ? { ...ar, link: e.target.value } : ar
                                            ),
                                          }
                                        : it
                                    )
                                  )
                                }
                              />
                              <div className="flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setCategories(a =>
                                      a.map((it, i) =>
                                        i === idx
                                          ? { ...it, articles: it.articles.filter((_, j) => j !== aIdx) }
                                          : it
                                      )
                                    )
                                  }
                                >
                                  Remove Article
                                </Button>
                              </div>
                            </div>
                          ))}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCategories(a =>
                                a.map((it, i) =>
                                  i === idx
                                    ? { ...it, articles: [...(it.articles || []), { title: "", link: "" }] }
                                    : it
                                )
                              );
                              setCatArticleDraftIdx(prev => {
                                const set = new Set(prev[idx] ?? new Set());
                                const nextIndex = (categories[idx]?.articles?.length ?? 0); // appended at end
                                set.add(nextIndex);
                                return { ...prev, [idx]: set };
                              });
                            }}
                          >
                            Add Article
                          </Button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2 mt-3">
                        <Button
                          variant="outline"
                          disabled={loading}
                          onClick={async () => {
                            await deleteItem("categories", idx);
                            setCategories(a => a.filter((_, i) => i !== idx));
                          }}
                        >
                          Remove
                        </Button>
                        <Button
                          disabled={loading}
                          onClick={async () => {
                            // On save, move draft rows to the top (newest first), then clear draft markers
                            const drafts = Array.from(catArticleDraftIdx[idx] ?? new Set());
                            let nextCat = categories[idx];
                            if (drafts.length > 0) {
                              const arts = nextCat.articles.slice();
                              const draftItems = drafts.map(i => arts[i]).filter(Boolean).reverse();
                              const rest = arts.filter((_, i) => !drafts.includes(i));
                              nextCat = { ...nextCat, articles: [...draftItems, ...rest] };
                              setCategories(arr => arr.map((it, i) => i === idx ? nextCat : it));
                            }
                            await saveItem("categories", idx, nextCat);
                            setCatArticleDraftIdx(prev => {
                              const copy = { ...prev };
                              delete copy[idx];
                              return copy;
                            });
                          }}
                        >
                          {loading ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}

            {/* Drafts */}
            {catDrafts.map((draft, idx) => (
              <div key={`cat-draft-${idx}`} className="border rounded-2xl p-4 shadow-sm">
                <div className="space-y-3">
                  <Badge variant="secondary">Draft</Badge>
                  <Input
                    placeholder="Title"
                    value={draft.title}
                    onChange={e =>
                      setCatDrafts(a => a.map((it, i) => (i === idx ? { ...it, title: e.target.value } : it)))
                    }
                  />

                  <Input
                    placeholder="Description"
                    value={draft.description || ""}
                    onChange={e =>
                      setCatDrafts(a => a.map((it, i) => (i === idx ? { ...it, description: e.target.value } : it)))
                    }
                  />

                  {/* Draft Articles */}
                  {(draft.articles || []).map((art, aIdx) => (
                    <div key={aIdx} className="space-y-2">
                      <div className="relative">
                        <Input
                          placeholder="Search article title"
                          value={art.title}
                          onChange={e => {
                            const val = e.target.value;
                            setCatDrafts(a =>
                              a.map((it, i) =>
                                i === idx
                                  ? {
                                      ...it,
                                      articles: it.articles.map((ar, j) =>
                                        j === aIdx ? { ...ar, title: val } : ar
                                      ),
                                    }
                                  : it
                              )
                            );
                            debouncedSuggest(`cat:d:${idx}:${aIdx}`, val, "cat");
                          }}
                          onFocus={e => debouncedSuggest(`cat:d:${idx}:${aIdx}`, e.currentTarget.value, "cat")}
                        />
                        <SuggestBox
                          items={catArticleSugs[`cat:d:${idx}:${aIdx}`] || []}
                          onPick={sel => {
                            setCatDrafts(a =>
                              a.map((it, i) =>
                                i === idx
                                  ? {
                                      ...it,
                                      articles: it.articles.map((ar, j) =>
                                        j === aIdx ? { title: sel.title, link: sel.link } : ar
                                      ),
                                    }
                                  : it
                              )
                            );
                            setCatArticleSugs(p => ({ ...p, [`cat:d:${idx}:${aIdx}`]: [] }));
                          }}
                        />
                      </div>
                      <Input
                        placeholder="Link"
                        value={art.link || ""}
                        onChange={e =>
                          setCatDrafts(a =>
                            a.map((it, i) =>
                              i === idx
                                ? {
                                    ...it,
                                    articles: it.articles.map((ar, j) =>
                                      j === aIdx ? { ...ar, link: e.target.value } : ar
                                    ),
                                  }
                                : it
                            )
                          )
                        }
                      />
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCatDrafts(a =>
                              a.map((it, i) =>
                                i === idx
                                  ? { ...it, articles: it.articles.filter((_, j) => j !== aIdx) }
                                  : it
                              )
                            )
                          }
                        >
                          Remove Article
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCatDrafts(a =>
                        a.map((it, i) => (i === idx ? { ...it, articles: [{ title: '', link: '' }, ...((it.articles || []))] } : it))
                      )
                    }
                  >
                    Add Article
                  </Button>

                  <div className="flex justify-end gap-2 mt-3">
                    <Button variant="outline" onClick={() => setCatDrafts(a => a.filter((_, i) => i !== idx))}>
                      <X className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                    <Button
                      disabled={loading}
                      onClick={async () => {
                        await saveItem("categories", undefined, draft);
                        setCategories(a => [draft, ...a]);
                        setCatDrafts(a => a.filter((_, i) => i !== idx));
                      }}
                    >
                      {loading ? "Saving..." : "Add"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Button (outside drafts) */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setCatDrafts(a => [...a, { title: "", description: "", articles: [] }])
                }
              >
                Add Category
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Popular Articles */}
        <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
            <CardTitle>Popular Articles</CardTitle>
            <Badge variant="secondary">popularArticles</Badge>
            </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-6">
                {popular.map((p, idx) => {
                const number = idx + 1;
                const open = popOpen.has(idx);
                return (
                <div key={idx} className="border rounded-2xl p-4 mb-4 shadow-sm">
                    <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() =>
                        setPopOpen((prev) => {
                        const next = new Set(prev);
                        if (next.has(idx)) next.delete(idx);
                        else next.add(idx);
                        return next;
                        })
                    }
                    >
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="min-w-8 justify-center">
                        #{number}
                        </Badge>
                        <span className="font-medium">{p.title || "Untitled"}</span>
                    </div>
                    {open ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                    </div>

                    {open && (
                    <>
                        <div className="grid grid-cols-[auto,1fr,1fr,1fr,1fr] gap-2 items-center mt-4">
                        {/* Empty cell to align like Trending Topics badge column */}
                        <div />
                        <div className="relative">
                            <Input
                            placeholder="Title"
                            value={p.title}
                            onChange={async (e) => {
                                const val = e.target.value;
                                setPopular((arr) =>
                                arr.map((it, i) =>
                                    i === idx ? { ...it, title: val } : it
                                )
                                );
                                debouncedSuggest(idx, val, "pop");
                            }}
                            onFocus={async (e) => {
                                const val = e.currentTarget.value;
                                debouncedSuggest(idx, val, "pop");
                            }}
                            />
                            <SuggestBox
                            items={popSugs[idx] || []}
                            onPick={(sel) => {
                                setPopular((arr) =>
                                  arr.map((it, i) =>
                                    i === idx
                                      ? { ...it, title: sel.title, link: sel.link, category: sel.category || it.category, views: sel.views || it.views }
                                      : it
                                  )
                                );
                                setPopSugs((prev) => ({ ...prev, [idx]: [] }));
                            }}
                            />
                        </div>
                        <Input
                            placeholder="Category"
                            value={p.category}
                            onChange={(e) =>
                            setPopular((arr) =>
                                arr.map((it, i) =>
                                i === idx ? { ...it, category: e.target.value } : it
                                )
                            )
                            }
                        />
                        <Input
                            placeholder="Views (e.g., 15.2K)"
                            value={p.views || ""}
                            onChange={(e) =>
                            setPopular((arr) =>
                                arr.map((it, i) =>
                                i === idx ? { ...it, views: e.target.value } : it
                                )
                            )
                            }
                        />
                        <Input
                            placeholder="Link"
                            value={p.link || ""}
                            onChange={(e) =>
                            setPopular((arr) =>
                                arr.map((it, i) =>
                                i === idx ? { ...it, link: e.target.value } : it
                                )
                            )
                            }
                        />
                        </div>

                        <div className="flex justify-end gap-2 mt-3">
                        <Button
                            variant="outline"
                            disabled={loading}
                            onClick={async () => {
                            await deleteItem("popularArticles", idx);
                            setPopular((arr) => arr.filter((_, i) => i !== idx));
                            }}
                        >
                            Remove
                        </Button>
                        <Button
                            disabled={loading}
                            onClick={async () =>
                            saveItem("popularArticles", idx, popular[idx])
                            }
                        >
                            {loading ? "Saving..." : "Save"}
                        </Button>
                        </div>
                    </>
                    )}
                </div>
                );
            })}

            {popDrafts.map((draft, idx) => (
                <div
                key={`pop-draft-${idx}`}
                className="border rounded-2xl p-4 mb-4 shadow-sm"
                >
                <div className="grid grid-cols-[auto,1fr,1fr,1fr,1fr] gap-2 items-center">
                    <div className="flex items-center">
                    <Badge variant="secondary" className="min-w-12 justify-center">
                        Draft
                    </Badge>
                    </div>
                    <div className="relative">
                    <Input
                        placeholder="Title"
                        value={draft.title}
                        onChange={async (e) => {
                        const val = e.target.value;
                        setPopDrafts((arr) =>
                            arr.map((it, i) =>
                            i === idx ? { ...it, title: val } : it
                            )
                        );
                        debouncedSuggest(`d:${idx}`, val, "pop");
                        }}
                        onFocus={async (e) => {
                        const val = e.currentTarget.value;
                        debouncedSuggest(`d:${idx}`, val, "pop");
                        }}
                    />
                    <SuggestBox
                        items={popSugs[`d:${idx}`] || []}
                        onPick={(sel) => {
                          setPopDrafts((arr) =>
                            arr.map((it, i) =>
                              i === idx
                                ? { ...it, title: sel.title, link: sel.link, category: sel.category || it.category, views: sel.views || it.views }
                                : it
                            )
                          );
                          setPopSugs((prev) => ({ ...prev, [`d:${idx}`]: [] }));
                        }}
                    />
                    </div>
                    <Input
                    placeholder="Category"
                    value={draft.category}
                    onChange={(e) =>
                        setPopDrafts((arr) =>
                        arr.map((it, i) =>
                            i === idx ? { ...it, category: e.target.value } : it
                        )
                        )
                    }
                    />
                    <Input
                    placeholder="Views (e.g., 15.2K)"
                    value={draft.views || ""}
                    onChange={(e) =>
                        setPopDrafts((arr) =>
                        arr.map((it, i) =>
                            i === idx ? { ...it, views: e.target.value } : it
                        )
                        )
                    }
                    />
                    <Input
                    placeholder="Link"
                    value={draft.link || ""}
                    onChange={(e) =>
                        setPopDrafts((arr) =>
                        arr.map((it, i) =>
                            i === idx ? { ...it, link: e.target.value } : it
                        )
                        )
                    }
                    />
                </div>

                <div className="flex justify-end gap-2 mt-3">
                    <Button
                    variant="outline"
                    onClick={() =>
                        setPopDrafts((arr) => arr.filter((_, i) => i !== idx))
                    }
                    >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                    </Button>
                    <Button
                    disabled={loading}
                    onClick={async () => {
                        await saveItem("popularArticles", undefined, draft);
                        setPopular((arr) => [draft, ...arr]);
                        setPopDrafts((arr) => arr.filter((_, i) => i !== idx));
                    }}
                    >
                    {loading ? "Saving..." : "Add"}
                    </Button>
                </div>
                </div>
            ))}

            <div className="flex gap-2">
                <Button
                variant="outline"
                onClick={() =>
                    setPopDrafts((arr) => [
                    ...arr,
                    { title: "", category: "", views: "", link: "" },
                    ])
                }
                >
                Add Article
                </Button>
            </div>
            </div>
        </CardContent>
        </Card>


      {/* Video Tutorials */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Video Tutorials</CardTitle>
            <Badge variant="secondary">videoTutorials</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {videos.map((v, idx) => {
            const number = idx + 1;
            const open = vidOpen.has(idx);
            return (
              <div key={idx} className="border rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between cursor-pointer" onClick={()=> setVidOpen(prev=> { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; })}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="min-w-8 justify-center">#{number}</Badge>
                    <span className="font-medium">{v.title || 'Untitled'}</span>
                  </div>
                  {open ? <ChevronDown className="h-4 w-4"/> : <ChevronRight className="h-4 w-4"/>}
                </div>
                {open && (
                  <>
                    <div className="space-y-3 mt-4">
                      <Input placeholder="Link" value={v.link || ''} onChange={(e)=> setVideos(arr=> arr.map((it,i)=> i===idx? { ...it, link: e.target.value } : it))} />
                      <Input placeholder="Title" value={v.title} onChange={(e)=> setVideos(arr=> arr.map((it,i)=> i===idx? { ...it, title: e.target.value } : it))} />
                      <Input placeholder="Duration (e.g., 5:32)" value={v.duration} onChange={(e)=> setVideos(arr=> arr.map((it,i)=> i===idx? { ...it, duration: e.target.value } : it))} />
                    </div>
                    <div className="flex justify-end gap-2 mt-3">
                      <Button variant="outline" disabled={loading} onClick={async ()=> { await deleteItem('videoTutorials', idx); setVideos(arr=> arr.filter((_,i)=>i!==idx)); }}>Remove</Button>
                      <Button disabled={loading} onClick={async ()=> { await saveItem('videoTutorials', idx, videos[idx]); }}>Save</Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}

          {vidDrafts.map((draft, idx) => (
            <div key={`vid-draft-${idx}`} className="border rounded-2xl p-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center">
                  <Badge variant="secondary" className="min-w-12 justify-center">Draft</Badge>
                </div>
                <Input placeholder="Link" value={draft.link || ''} onChange={(e)=> setVidDrafts(arr=> arr.map((it,i)=> i===idx? { ...it, link: e.target.value } : it))} />
                <Input placeholder="Title" value={draft.title} onChange={(e)=> setVidDrafts(arr=> arr.map((it,i)=> i===idx? { ...it, title: e.target.value } : it))} />
                <Input placeholder="Duration (e.g., 5:32)" value={draft.duration} onChange={(e)=> setVidDrafts(arr=> arr.map((it,i)=> i===idx? { ...it, duration: e.target.value } : it))} />
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <Button variant="outline" onClick={()=> setVidDrafts(arr=> arr.filter((_,i)=> i!==idx))}><X className="h-4 w-4 mr-1"/>Cancel</Button>
                <Button disabled={loading} onClick={async ()=> { await saveItem('videoTutorials', undefined, draft); setVideos(arr=> [draft, ...arr]); setVidDrafts(arr=> arr.filter((_,i)=> i!==idx)); }}>Add</Button>
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button variant="outline" onClick={()=> setVidDrafts(arr=> [...arr, { title: '', duration: '' }])}>Add Video</Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
