"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHero from '@/components/shared/PageHero'
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";

type Plan = {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features?: string[];
  popular?: boolean;
  cta?: string;
  stripePriceId?: string;
  paymentType?: 'subscription' | 'payment';
  amount?: number;
  currency?: string;
};

type FAQ = { question: string; answer: string };

export default function AdminPricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planDrafts, setPlanDrafts] = useState<Plan[]>([]);
  const [planOpen, setPlanOpen] = useState<Set<number>>(new Set());
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqDrafts, setFaqDrafts] = useState<FAQ[]>([]);
  const [faqOpen, setFaqOpen] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  async function loadPlans() {
    try {
      const pRes = await fetch("/api/admin/pricing/plans", { cache: "no-store" });
      if (pRes.ok) {
        const pj = await pRes.json();
        setPlans(Array.isArray(pj.plans) ? pj.plans : []);
      }
    } catch {}
  }

  async function loadFaqs() {
    try {
      const fRes = await fetch("/api/admin/pricing/faqs", { cache: "no-store" });
      if (fRes.ok) {
        const fj = await fRes.json();
        setFaqs(Array.isArray(fj.faqs) ? fj.faqs : []);
      }
    } catch {}
  }

  function normalizePlan(p: Plan): Plan {
    const hasAmount = typeof p.amount === 'number' && !Number.isNaN(p.amount);
    const currency = (p.currency || '').trim();
    let price = (p.price || '').trim();
    if (!price && hasAmount && currency) {
      price = `${currency.toUpperCase()} ${p.amount}`;
    }
    return { ...p, price };
  }

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([loadPlans(), loadFaqs()]);
      } catch {}
    })();
  }, []);

  function validatePlan(p: Plan) {
    if (!p.name?.trim()) return "Name is required";
    const hasPriceString = !!p.price?.trim();
    const hasAmountCurrency = (typeof p.amount === 'number' && !Number.isNaN(p.amount)) && !!p.currency?.trim();
    if (!hasPriceString && !hasAmountCurrency) return "Provide price or amount and currency";
    return "";
  }

  function validateFaq(i: FAQ) {
    if (!i.question?.trim()) return "Question is required";
    if (!i.answer?.trim()) return "Answer is required";
    return "";
  }

  async function savePlan(index: number, item: Plan) {
    const err = validatePlan(item);
    if (err) return toast.error(err);
    try {
      setLoading(true);
      const toSend = normalizePlan(item);
      const res = await fetch("/api/admin/pricing/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index, item: toSend }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Saved");
      await loadPlans();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function addPlan(draftIndex: number, item: Plan) {
    const err = validatePlan(item);
    if (err) return toast.error(err);
    try {
      setLoading(true);
      const toSend = normalizePlan(item);
      if (!toSend.price?.trim()) {
        throw new Error("Provide price or amount and currency");
      }
      const res = await fetch("/api/admin/pricing/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: toSend, op: "add" }),
      });
      if (!res.ok) throw new Error("Failed to add");
      await loadPlans();
      setPlanDrafts((arr) => arr.filter((_, i) => i !== draftIndex));
      toast.success("Added");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deletePlan(index: number) {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/pricing/plans", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      await loadPlans();
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveFaq(index: number, item: FAQ) {
    const err = validateFaq(item);
    if (err) return toast.error(err);
    try {
      setLoading(true);
      const res = await fetch("/api/admin/pricing/faqs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index, item }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Saved");
      await loadFaqs();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function addFaq(draftIndex: number, item: FAQ) {
    const err = validateFaq(item);
    if (err) return toast.error(err);
    try {
      setLoading(true);
      const res = await fetch("/api/admin/pricing/faqs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, op: "add" }),
      });
      if (!res.ok) throw new Error("Failed to add");
      await loadFaqs();
      setFaqDrafts((arr) => arr.filter((_, i) => i !== draftIndex));
      toast.success("Added");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteFaq(index: number) {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/pricing/faqs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      await loadFaqs();
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <PageHero
        title="Pricing"
        subtitle="Manage plans and FAQs shown on the public Pricing page."
        badge="Admin"
        actions={<Button variant="outline" onClick={() => router.back()}>Back</Button>}
      />
      <div className="container mx-auto px-4 py-10 max-w-5xl space-y-10">
        {/* Plans */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Plans</CardTitle>
              <Badge variant="secondary">pricing:plans</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {plans.map((item, idx) => {
                const number = idx + 1;
                const open = planOpen.has(idx);
                return (
                  <div key={idx} className="border rounded-2xl p-4 mb-4 shadow-sm">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() =>
                        setPlanOpen((prev) => {
                          const next = new Set(prev);
                          if (next.has(idx)) {
                            next.delete(idx);
                          } else {
                            next.add(idx);
                          }
                          return next;
                        })
                      }
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="min-w-8 justify-center">#{number}</Badge>
                        <span className="font-medium">{item.name || "Untitled"}</span>
                      </div>
                      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                    {open && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                          <Input placeholder="Name" required value={item.name}
                            onChange={(e) => setPlans((arr) => arr.map((t, i) => i === idx ? { ...t, name: e.target.value } : t))} />
                          <Input placeholder="Price (e.g. $9.99 or Custom)" required value={item.price}
                            onChange={(e) => setPlans((arr) => arr.map((t, i) => i === idx ? { ...t, price: e.target.value } : t))} />
                          <Input placeholder="Period (e.g. /month)" value={item.period || ""}
                            onChange={(e) => setPlans((arr) => arr.map((t, i) => i === idx ? { ...t, period: e.target.value } : t))} />
                          <Input placeholder="CTA label (e.g. Get Started)" value={item.cta || ""}
                            onChange={(e) => setPlans((arr) => arr.map((t, i) => i === idx ? { ...t, cta: e.target.value } : t))} />
                          <Textarea className="md:col-span-2" placeholder="Description" value={item.description || ""}
                            onChange={(e) => setPlans((arr) => arr.map((t, i) => i === idx ? { ...t, description: e.target.value } : t))} />
                          <Textarea className="md:col-span-2" placeholder="Features (one per line)" value={(item.features || []).join("\n")}
                            onChange={(e) => setPlans((arr) => arr.map((t, i) => i === idx ? { ...t, features: e.target.value.split(/\r?\n/).filter(Boolean) } : t))} />
                          <Input placeholder="Stripe Price ID (optional)" value={item.stripePriceId || ''}
                            onChange={(e) => setPlans((arr) => arr.map((t, i) => i === idx ? { ...t, stripePriceId: e.target.value } : t))} />
                          <div className="md:col-span-2">
                            <label className="text-sm text-muted-foreground mr-2">Payment type</label>
                            <select
                              className="border rounded-md px-3 py-2 w-full bg-background"
                              value={item.paymentType || 'subscription'}
                              onChange={(e) => setPlans((arr) => arr.map((t, i) => i === idx ? { ...t, paymentType: (e.target.value as 'subscription' | 'payment') } : t))}
                             >
                              <option value="subscription">subscription</option>
                              <option value="payment">payment</option>
                            </select>
                          </div>
                          <Input placeholder="Amount (number)" type="number" value={Number.isFinite(item.amount as number) ? String(item.amount) : ''}
                            onChange={(e) => setPlans((arr) => arr.map((t, i) => i === idx ? { ...t, amount: e.target.value === '' ? undefined : Number(e.target.value) } : t))} />
                          <Input placeholder="Currency (e.g., ETB, USD)" value={item.currency || ''}
                            onChange={(e) => setPlans((arr) => arr.map((t, i) => i === idx ? { ...t, currency: e.target.value.toUpperCase() } : t))} />
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <Button variant="outline" disabled={loading} onClick={async () => { await deletePlan(idx); }}>Remove</Button>
                          <Button disabled={loading} onClick={() => savePlan(idx, plans[idx])}>{loading ? 'Saving...' : 'Save'}</Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {planDrafts.map((item, idx) => (
                <div key={`plan-draft-${idx}`} className="border rounded-2xl p-4 mb-4 shadow-sm">
                    <div className="flex items-center mb-3">
                        <Badge variant="secondary" className="min-w-12 justify-center">Draft</Badge>
                    </div>
                    <Input className="mb-3" placeholder="Name" required value={item.name}
                        onChange={(e) => setPlanDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, name: e.target.value } : t))} />
                    <Input className="mb-3" placeholder="Period (e.g. /month)" value={item.period || ""}
                        onChange={(e) => setPlanDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, period: e.target.value } : t))} />
                    <Input className="mb-3" placeholder="CTA label (e.g. Get Started)" value={item.cta || ""}
                        onChange={(e) => setPlanDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, cta: e.target.value } : t))} />
                    <Textarea className="md:col-span-2 mb-3" placeholder="Description" value={item.description || ""}
                        onChange={(e) => setPlanDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, description: e.target.value } : t))} />
                    <Textarea className="md:col-span-2 mb-3" placeholder="Features (one per line)" value={(item.features || []).join("\n")}
                        onChange={(e) => setPlanDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, features: e.target.value.split(/\r?\n/).filter(Boolean) } : t))} />
                    <Input className="mb-3" placeholder="Stripe Price ID (optional)" value={item.stripePriceId || ''}
                        onChange={(e) => setPlanDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, stripePriceId: e.target.value } : t))} />
                    <div className="mb-3">
                        <label className="text-sm text-muted-foreground mr-2">Payment type</label>
                        <select
                        className="border rounded-md px-3 py-2 w-full bg-background"
                        value={item.paymentType || 'subscription'}
                        onChange={(e) => setPlanDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, paymentType: (e.target.value as 'subscription' | 'payment') } : t))}
                        >
                        <option value="subscription">subscription</option>
                        <option value="payment">payment</option>
                        </select>
                    </div>
                    <Input placeholder="Amount (number)" type="number" value={Number.isFinite(item.amount as number) ? String(item.amount) : ''}
                        onChange={(e) => setPlanDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, amount: e.target.value === '' ? undefined : Number(e.target.value) } : t))} />
                    <Input placeholder="Currency (e.g., ETB, USD)" value={item.currency || ''}
                        onChange={(e) => setPlanDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, currency: e.target.value.toUpperCase() } : t))} />
                    <div className="flex justify-end gap-2 mt-3">
                        <Button variant="outline" onClick={() => setPlanDrafts((arr) => arr.filter((_, i) => i !== idx))}><X className="h-4 w-4 mr-1" />Cancel</Button>
                        <Button disabled={loading} onClick={() => addPlan(idx, planDrafts[idx])}>{loading ? 'Saving...' : 'Add'}</Button>
                    </div>
                </div>
              ))}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setPlanDrafts((arr) => [...arr, { name: '', price: '', period: '', description: '', features: [], cta: 'Get Started', amount: undefined, currency: '' }])}>Add Plan</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>FAQs</CardTitle>
              <Badge variant="secondary">pricing:faqs</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {faqs.map((item, idx) => {
                const number = idx + 1;
                const open = faqOpen.has(idx);
                return (
                  <div key={idx} className="border rounded-2xl p-4 mb-4 shadow-sm">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() =>
                        setFaqOpen((prev) => {
                          const next = new Set(prev);
                          if (next.has(idx)) {
                            next.delete(idx);
                          } else {
                            next.add(idx);
                          }
                          return next;
                        })
                      }
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="min-w-8 justify-center">#{number}</Badge>
                        <span className="font-medium">{item.question || "Untitled"}</span>
                      </div>
                      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                    {open && (
                      <>
                        <div className="grid grid-cols-1 gap-3 mt-4">
                          <Input placeholder="Question" required value={item.question}
                            onChange={(e) => setFaqs((arr) => arr.map((t, i) => i === idx ? { ...t, question: e.target.value } : t))} />
                          <Textarea placeholder="Answer" required value={item.answer}
                            onChange={(e) => setFaqs((arr) => arr.map((t, i) => i === idx ? { ...t, answer: e.target.value } : t))} />
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <Button variant="outline" disabled={loading} onClick={async () => { await deleteFaq(idx) }}>Remove</Button>
                          <Button disabled={loading} onClick={() => saveFaq(idx, faqs[idx])}>{loading ? 'Saving...' : 'Save'}</Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {faqDrafts.map((item, idx) => (
                <div key={`faq-draft-${idx}`} className="border rounded-2xl p-4 mb-4 shadow-sm">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center">
                      <Badge variant="secondary" className="min-w-12 justify-center">Draft</Badge>
                    </div>
                    <Input placeholder="Question" required value={item.question}
                      onChange={(e) => setFaqDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, question: e.target.value } : t))} />
                    <Textarea placeholder="Answer" required value={item.answer}
                      onChange={(e) => setFaqDrafts((arr) => arr.map((t, i) => i === idx ? { ...t, answer: e.target.value } : t))} />
                  </div>
                  <div className="flex justify-end gap-2 mt-3">
                    <Button variant="outline" onClick={() => setFaqDrafts((arr) => arr.filter((_, i) => i !== idx))}><X className="h-4 w-4 mr-1" />Cancel</Button>
                    <Button disabled={loading} onClick={() => addFaq(idx, faqDrafts[idx])}>{loading ? 'Saving...' : 'Add'}</Button>
                  </div>
                </div>
              ))}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setFaqDrafts((arr) => [...arr, { question: '', answer: '' }])}>Add FAQ</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
