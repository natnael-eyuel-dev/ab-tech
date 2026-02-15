"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import PageHero from '@/components/shared/PageHero'
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { X, ChevronDown, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation";

type TrendingTopic = { name: string; posts?: string | number; followers?: string | number }
type RecentDiscussion = { title: string; author: string; replies: string | number; views: string | number; lastActivity: string; category: string; link?: string; date?: string; time?: string }
type UpcomingEvent = { title: string; date: string; time: string; location: string; attendees: string | number; type: string }
type FeaturedMember = { name: string; role: string; contributions: string | number; followers: string | number; expertise: string[] }
type FeaturedMemberDraft = FeaturedMember & { expertiseText?: string }

export default function AdminCommunityPage() {
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([])
  const [recentDiscussions, setRecentDiscussions] = useState<RecentDiscussion[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [featuredMembers, setFeaturedMembers] = useState<FeaturedMember[]>([])
  // Drafts (new, unsaved items)
  const [trendingTopicsDrafts, setTrendingTopicsDrafts] = useState<TrendingTopic[]>([])
  const [recentDiscussionsDrafts, setRecentDiscussionsDrafts] = useState<RecentDiscussion[]>([])
  const [upcomingEventsDrafts, setUpcomingEventsDrafts] = useState<UpcomingEvent[]>([])
  const [featuredMembersDrafts, setFeaturedMembersDrafts] = useState<FeaturedMemberDraft[]>([])
  const [loading, setLoading] = useState(false)
  // expand/collapse sets for existing items
  const [trendingOpen, setTrendingOpen] = useState<Set<number>>(new Set())
  const [recentOpen, setRecentOpen] = useState<Set<number>>(new Set())
  const [eventsOpen, setEventsOpen] = useState<Set<number>>(new Set())
  const [membersOpen, setMembersOpen] = useState<Set<number>>(new Set())
  const router = useRouter();

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/admin/community/sections")
        if (!res.ok) return
        const data = await res.json()
        setTrendingTopics(data.trendingTopics || [])
        setRecentDiscussions(data.recentDiscussions || [])
        setUpcomingEvents(data.upcomingEvents || [])
        setFeaturedMembers(data.featuredMembers || [])
      } catch {}
    })()
  }, [])

  // Validation helpers (required fields)
  function validateItem(key: string, item: any): string[] {
    const errors: string[] = []
    const req = (v: any, label: string) => {
      if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) errors.push(`${label} is required`)
    }
    if (key === 'trendingTopics') {
      req(item.name, 'Name'); req(item.posts, 'Posts'); req(item.followers, 'Followers')
    } else if (key === 'recentDiscussions') {
      req(item.title, 'Title'); req(item.author, 'Author'); req(item.replies, 'Replies'); req(item.views, 'Views'); req(item.lastActivity, 'Last Activity'); req(item.category, 'Category'); req(item.link, 'Link'); req(item.date, 'Date'); req(item.time, 'Time')
    } else if (key === 'upcomingEvents') {
      req(item.title, 'Title'); req(item.date, 'Date'); req(item.time, 'Time'); req(item.location, 'Location'); req(item.attendees, 'Attendees'); req(item.type, 'Type')
    } else if (key === 'featuredMembers') {
      req(item.name, 'Name'); req(item.role, 'Role'); req(item.contributions, 'Contributions'); req(item.followers, 'Followers');
      if (!Array.isArray(item.expertise) || item.expertise.length === 0) errors.push('At least one Expertise is required')
    }
    return errors
  }

  const saveItem = async (key: string, index: number, item: any) => {
    const errors = validateItem(key, item)
    if (errors.length) { toast.error(errors[0]); return }
    try {
      setLoading(true)
      const res = await fetch("/api/admin/community/sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, index, item }),
      })
      if (!res.ok) throw new Error("Failed to save item")
      toast.success("Saved")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Save a draft (append a new item). After success, move from drafts to persisted.
  const saveDraft = async (key: string, draftIndex: number, item: any) => {
    const errors = validateItem(key, item)
    if (errors.length) { toast.error(errors[0]); return }
    try {
      setLoading(true)
      const res = await fetch("/api/admin/community/sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, item }), // no index -> add
      })
      if (!res.ok) throw new Error("Failed to add item")
      // Move draft into persisted state (prepend for visual recency)
      if (key === 'trendingTopics') {
        setTrendingTopics((arr) => [item, ...arr])
        setTrendingTopicsDrafts((arr) => arr.filter((_, i) => i !== draftIndex))
      } else if (key === 'recentDiscussions') {
        setRecentDiscussions((arr) => [item, ...arr])
        setRecentDiscussionsDrafts((arr) => arr.filter((_, i) => i !== draftIndex))
      } else if (key === 'upcomingEvents') {
        setUpcomingEvents((arr) => [item, ...arr])
        setUpcomingEventsDrafts((arr) => arr.filter((_, i) => i !== draftIndex))
      } else if (key === 'featuredMembers') {
        setFeaturedMembers((arr) => [item, ...arr])
        setFeaturedMembersDrafts((arr) => arr.filter((_, i) => i !== draftIndex))
      }
      toast.success('Added')
    } catch (e) {
      toast.error((e as Error).message)
    } finally { setLoading(false) }
  }

  const deleteItem = async (key: string, index: number) => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/community/sections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, index }),
      })
      if (!res.ok) throw new Error("Failed to delete item")
      toast.success("Deleted")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <PageHero
        title="Community Sections"
        subtitle="Manage the content that appears on the public Community page."
        badge="Admin"
        actions={<Button variant="outline" onClick={() => router.back()}>Back</Button>}
      />
      <div className="container mx-auto px-4 py-10 max-w-5xl space-y-10">
        {/* Trending Topics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Trending Topics</CardTitle>
              <Badge variant="secondary">trendingTopics</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {trendingTopics.map((item, idx) => {
                const number = trendingTopics.length - idx
                return (
                  <div key={idx} className="border rounded-2xl p-4 mb-4 shadow-sm">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => {
                      setTrendingOpen((prev) => {
                        const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next;
                      })
                    }}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="min-w-8 justify-center">#{number}</Badge>
                        <span className="font-medium">{item.name || 'Untitled'}</span>
                      </div>
                      {trendingOpen.has(idx) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                    {trendingOpen.has(idx) && (
                      <>
                        <div className="grid grid-cols-[auto,1fr,1fr,1fr] gap-2 items-center mt-4">
                          <Input placeholder="Name" required value={item.name} onChange={(e) => setTrendingTopics((arr) => arr.map((t, i) => i === idx ? { ...t, name: e.target.value } : t))} />
                          <Input placeholder="Posts" required value={String(item.posts ?? '')} onChange={(e) => setTrendingTopics((arr) => arr.map((t, i) => i === idx ? { ...t, posts: e.target.value } : t))} />
                          <Input placeholder="Followers" required value={String(item.followers ?? '')} onChange={(e) => setTrendingTopics((arr) => arr.map((t, i) => i === idx ? { ...t, followers: e.target.value } : t))} />
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <Button variant="outline" disabled={loading} onClick={async () => { await deleteItem('trendingTopics', idx); setTrendingTopics((arr) => arr.filter((_, i) => i !== idx)); }}>Remove</Button>
                          <Button disabled={loading} onClick={() => saveItem('trendingTopics', idx, trendingTopics[idx])}>{loading ? 'Saving...' : 'Save'}</Button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}

              {trendingTopicsDrafts.map((item, idx) => (
                <div key={`draft-${idx}`} className="border rounded-2xl p-4 mb-4 shadow-sm">
                  <div className="grid grid-cols-[auto,1fr,1fr,1fr] gap-2 items-center">
                    <div className="flex items-center">
                      <Badge variant="secondary" className="min-w-12 justify-center">Draft</Badge>
                    </div>
                    <Input placeholder="Name" required value={item.name}
                      onChange={(e) => setTrendingTopicsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, name: e.target.value } : t))} />
                    <Input placeholder="Posts" required value={String(item.posts ?? '')}
                      onChange={(e) => setTrendingTopicsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, posts: e.target.value } : t))} />
                    <Input placeholder="Followers" required value={String(item.followers ?? '')}
                      onChange={(e) => setTrendingTopicsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, followers: e.target.value } : t))} />
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Button variant="outline" onClick={() => setTrendingTopicsDrafts((arr)=>arr.filter((_,i)=>i!==idx))}><X className="h-4 w-4 mr-1"/>Cancel</Button>
                    <Button disabled={loading} onClick={() => saveDraft('trendingTopics', idx, trendingTopicsDrafts[idx])}>{loading ? 'Saving...' : 'Add'}</Button>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setTrendingTopicsDrafts((arr) => [...arr, { name: '', posts: '', followers: '' }])}>Add Topic</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Discussions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Discussions</CardTitle>
              <Badge variant="secondary">recentDiscussions</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentDiscussions.map((item, idx) => {
                const number = recentDiscussions.length - idx
                return (
                  <div key={idx} className="border rounded-2xl p-4 mb-4 shadow-sm">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => {
                      setRecentOpen((prev) => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; })
                    }}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="min-w-8 justify-center">#{number}</Badge>
                        <span className="font-medium">{item.title || 'Untitled'}</span>
                      </div>
                      {recentOpen.has(idx) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                    {recentOpen.has(idx) && (
                      <>
                        <div className="grid grid-cols-[1fr,1fr,1fr,1fr,1fr,1fr,1fr,1fr,1fr] gap-2 items-center mt-4">
                          <Input placeholder="Title" required value={item.title} onChange={(e) => setRecentDiscussions((arr) => arr.map((t, i) => i === idx ? { ...t, title: e.target.value } : t))} />
                          <Input placeholder="Author" required value={item.author} onChange={(e) => setRecentDiscussions((arr) => arr.map((t, i) => i === idx ? { ...t, author: e.target.value } : t))} />
                          <Input placeholder="Replies" required value={String(item.replies ?? '')} onChange={(e) => setRecentDiscussions((arr) => arr.map((t, i) => i === idx ? { ...t, replies: e.target.value } : t))} />
                          <Input placeholder="Views" required value={String(item.views ?? '')} onChange={(e) => setRecentDiscussions((arr) => arr.map((t, i) => i === idx ? { ...t, views: e.target.value } : t))} />
                          <Input placeholder="Last Activity" required value={item.lastActivity} onChange={(e) => setRecentDiscussions((arr) => arr.map((t, i) => i === idx ? { ...t, lastActivity: e.target.value } : t))} />
                          <Input placeholder="Category" required value={item.category} onChange={(e) => setRecentDiscussions((arr) => arr.map((t, i) => i === idx ? { ...t, category: e.target.value } : t))} />
                          <Input placeholder="Link" required value={item.link ?? ''} onChange={(e) => setRecentDiscussions((arr) => arr.map((t, i) => i === idx ? { ...t, link: e.target.value } : t))} />
                          <Input placeholder="Date" type="date" required value={item.date ?? ''} onChange={(e) => setRecentDiscussions((arr) => arr.map((t, i) => i === idx ? { ...t, date: e.target.value } : t))} />
                          <Input placeholder="Time" type="time" required value={item.time ?? ''} onChange={(e) => setRecentDiscussions((arr) => arr.map((t, i) => i === idx ? { ...t, time: e.target.value } : t))} />
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <Button variant="outline" disabled={loading} onClick={async () => { await deleteItem('recentDiscussions', idx); setRecentDiscussions((arr) => arr.filter((_, i) => i !== idx)); }}>Remove</Button>
                          <Button disabled={loading} onClick={() => saveItem('recentDiscussions', idx, recentDiscussions[idx])}>{loading ? 'Saving...' : 'Save'}</Button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}

              {recentDiscussionsDrafts.map((item, idx) => (
                <div key={`rd-${idx}`} className="border rounded-2xl p-4 mb-4 shadow-sm">
                  <div className="grid grid-cols-[1fr,1fr,1fr,1fr,1fr,1fr,1fr,1fr,1fr] gap-2 items-center">
                    <Input placeholder="Title" required value={item.title} onChange={(e) => setRecentDiscussionsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, title: e.target.value } : t))} />
                    <Input placeholder="Author" required value={item.author} onChange={(e) => setRecentDiscussionsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, author: e.target.value } : t))} />
                    <Input placeholder="Replies" required value={String(item.replies ?? '')} onChange={(e) => setRecentDiscussionsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, replies: e.target.value } : t))} />
                    <Input placeholder="Views" required value={String(item.views ?? '')} onChange={(e) => setRecentDiscussionsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, views: e.target.value } : t))} />
                    <Input placeholder="Last Activity" required value={item.lastActivity} onChange={(e) => setRecentDiscussionsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, lastActivity: e.target.value } : t))} />
                    <Input placeholder="Category" required value={item.category} onChange={(e) => setRecentDiscussionsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, category: e.target.value } : t))} />
                    <Input placeholder="Link" required value={item.link ?? ''} onChange={(e) => setRecentDiscussionsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, link: e.target.value } : t))} />
                    <Input placeholder="Date" type="date" required value={item.date ?? ''} onChange={(e) => setRecentDiscussionsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, date: e.target.value } : t))} />
                    <Input placeholder="Time" type="time" required value={item.time ?? ''} onChange={(e) => setRecentDiscussionsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, time: e.target.value } : t))} />
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Button variant="outline" onClick={() => setRecentDiscussionsDrafts((arr)=>arr.filter((_,i)=>i!==idx))}><X className="h-4 w-4 mr-1"/>Cancel</Button>
                    <Button disabled={loading} onClick={() => saveDraft('recentDiscussions', idx, recentDiscussionsDrafts[idx])}>{loading ? 'Saving...' : 'Add'}</Button>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setRecentDiscussionsDrafts((arr) => [...arr, { title: '', author: '', replies: '', views: '', lastActivity: '', category: '', link: '', date: '', time: '' }])}>Add Discussion</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upcoming Events</CardTitle>
              <Badge variant="secondary">upcomingEvents</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {upcomingEvents.map((item, idx) => {
                const number = upcomingEvents.length - idx
                return (
                  <div key={idx} className="border rounded-2xl p-4 mb-4 shadow-sm">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => {
                      setEventsOpen((prev) => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; })
                    }}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="min-w-8 justify-center">#{number}</Badge>
                        <span className="font-medium">{item.title || 'Untitled'}</span>
                      </div>
                      {eventsOpen.has(idx) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                    {eventsOpen.has(idx) && (
                      <>
                        <div className="grid grid-cols-[auto,1fr,1fr,1fr,1fr,1fr,1fr] gap-2 items-center mt-4">
                          <Input placeholder="Title" required value={item.title} onChange={(e) => setUpcomingEvents((arr) => arr.map((t, i) => i === idx ? { ...t, title: e.target.value } : t))} />
                          <Input placeholder="Date" required value={item.date} onChange={(e) => setUpcomingEvents((arr) => arr.map((t, i) => i === idx ? { ...t, date: e.target.value } : t))} />
                          <Input placeholder="Time" required value={item.time} onChange={(e) => setUpcomingEvents((arr) => arr.map((t, i) => i === idx ? { ...t, time: e.target.value } : t))} />
                          <Input placeholder="Location" required value={item.location} onChange={(e) => setUpcomingEvents((arr) => arr.map((t, i) => i === idx ? { ...t, location: e.target.value } : t))} />
                          <Input placeholder="Attendees" required value={String(item.attendees ?? '')} onChange={(e) => setUpcomingEvents((arr) => arr.map((t, i) => i === idx ? { ...t, attendees: e.target.value } : t))} />
                          <Input placeholder="Type" required value={item.type} onChange={(e) => setUpcomingEvents((arr) => arr.map((t, i) => i === idx ? { ...t, type: e.target.value } : t))} />
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <Button variant="outline" disabled={loading} onClick={async () => { await deleteItem('upcomingEvents', idx); setUpcomingEvents((arr) => arr.filter((_, i) => i !== idx)); }}>Remove</Button>
                          <Button disabled={loading} onClick={() => saveItem('upcomingEvents', idx, upcomingEvents[idx])}>{loading ? 'Saving...' : 'Save'}</Button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}

              {upcomingEventsDrafts.map((item, idx) => (
                <div key={`ue-${idx}`} className="border rounded-2xl p-4 mb-4 shadow-sm">
                  <div className="grid grid-cols-[auto,1fr,1fr,1fr,1fr,1fr,1fr] gap-2 items-center">
                    <div className="flex items-center">
                      <Badge variant="secondary" className="min-w-12 justify-center">Draft</Badge>
                    </div>
                    <Input placeholder="Title" required value={item.title} onChange={(e) => setUpcomingEventsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, title: e.target.value } : t))} />
                    <Input placeholder="Date" required value={item.date} onChange={(e) => setUpcomingEventsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, date: e.target.value } : t))} />
                    <Input placeholder="Time" required value={item.time} onChange={(e) => setUpcomingEventsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, time: e.target.value } : t))} />
                    <Input placeholder="Location" required value={item.location} onChange={(e) => setUpcomingEventsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, location: e.target.value } : t))} />
                    <Input placeholder="Attendees" required value={String(item.attendees ?? '')} onChange={(e) => setUpcomingEventsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, attendees: e.target.value } : t))} />
                    <Input placeholder="Type" required value={item.type} onChange={(e) => setUpcomingEventsDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, type: e.target.value } : t))} />
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Button variant="outline" onClick={() => setUpcomingEventsDrafts((arr)=>arr.filter((_,i)=>i!==idx))}><X className="h-4 w-4 mr-1"/>Cancel</Button>
                    <Button disabled={loading} onClick={() => saveDraft('upcomingEvents', idx, upcomingEventsDrafts[idx])}>{loading ? 'Saving...' : 'Add'}</Button>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setUpcomingEventsDrafts((arr) => [...arr, { title: '', date: '', time: '', location: '', attendees: '', type: '' }])}>Add Event</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Featured Members</CardTitle>
              <Badge variant="secondary">featuredMembers</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {featuredMembers.map((item, idx) => {
                const number = featuredMembers.length - idx
                return (
                  <div key={idx} className="border rounded-2xl p-4 mb-4 shadow-sm">
                    <div className="flex items-center justify-between cursor-pointer" onClick={() => {
                      setMembersOpen((prev) => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; })
                    }}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="min-w-8 justify-center">#{number}</Badge>
                        <span className="font-medium">{item.name || 'Untitled'}</span>
                      </div>
                      {membersOpen.has(idx) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                    {membersOpen.has(idx) && (
                      <>
                        <div className="grid grid-cols-[auto,1fr,1fr,1fr,1fr,1fr] gap-2 items-center mt-4">
                          <Input placeholder="Name" required value={item.name} onChange={(e) => setFeaturedMembers((arr) => arr.map((t, i) => i === idx ? { ...t, name: e.target.value } : t))} />
                          <Input placeholder="Role" required value={item.role} onChange={(e) => setFeaturedMembers((arr) => arr.map((t, i) => i === idx ? { ...t, role: e.target.value } : t))} />
                          <Input placeholder="Contributions" required value={String(item.contributions ?? '')} onChange={(e) => setFeaturedMembers((arr) => arr.map((t, i) => i === idx ? { ...t, contributions: e.target.value } : t))} />
                          <Input placeholder="Followers" required value={String(item.followers ?? '')} onChange={(e) => setFeaturedMembers((arr) => arr.map((t, i) => i === idx ? { ...t, followers: e.target.value } : t))} />
                          <Input placeholder="Expertise (comma separated)" required value={(item.expertise || []).join(', ')} onChange={(e) => setFeaturedMembers((arr) => arr.map((t, i) => i === idx ? { ...t, expertise: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } : t))} />
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <Button variant="outline" disabled={loading} onClick={async () => { await deleteItem('featuredMembers', idx); setFeaturedMembers((arr) => arr.filter((_, i) => i !== idx)); }}>Remove</Button>
                          <Button disabled={loading} onClick={() => saveItem('featuredMembers', idx, featuredMembers[idx])}>{loading ? 'Saving...' : 'Save'}</Button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}

              {featuredMembersDrafts.map((item, idx) => (
                <div key={`fm-${idx}`} className="border rounded-2xl p-4 mb-4 shadow-sm">
                  <div className="grid grid-cols-[auto,1fr,1fr,1fr,1fr,1fr] gap-2 items-center">
                    <div className="flex items-center">
                      <Badge variant="secondary" className="min-w-12 justify-center">Draft</Badge>
                    </div>
                    <Input placeholder="Name" required value={item.name} onChange={(e) => setFeaturedMembersDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, name: e.target.value } : t))} />
                    <Input placeholder="Role" required value={item.role} onChange={(e) => setFeaturedMembersDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, role: e.target.value } : t))} />
                    <Input placeholder="Contributions" required value={String(item.contributions ?? '')} onChange={(e) => setFeaturedMembersDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, contributions: e.target.value } : t))} />
                    <Input placeholder="Followers" required value={String(item.followers ?? '')} onChange={(e) => setFeaturedMembersDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, followers: e.target.value } : t))} />
                    <Input placeholder="Expertise" required value={item.expertiseText ?? item.expertise?.join(", ") ?? ""}
                      onChange={(e) => setFeaturedMembersDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, expertiseText: e.target.value } : t))}
                      onBlur={() => setFeaturedMembersDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, expertise: (t.expertiseText || '').split(',').map((s)=>s.trim()).filter(Boolean) } : t))}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Button variant="outline" onClick={() => setFeaturedMembersDrafts((arr)=>arr.filter((_,i)=>i!==idx))}><X className="h-4 w-4 mr-1"/>Cancel</Button>
                    <Button disabled={loading} onClick={() => saveDraft('featuredMembers', idx, featuredMembersDrafts[idx])}>{loading ? 'Saving...' : 'Add'}</Button>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setFeaturedMembersDrafts((arr) => [...arr, { name: '', role: '', contributions: '', followers: '', expertise: [] }])}>Add Member</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}