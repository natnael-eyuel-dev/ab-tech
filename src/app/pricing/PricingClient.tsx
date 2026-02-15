"use client"

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, CircleHelp, Star } from "lucide-react";
import { Background } from "@/components/shared/Background";

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

export default function PricingClient() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/pricing', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        setPlans(Array.isArray(json.plans) ? json.plans : []);
        setFaqs(Array.isArray(json.faqs) ? json.faqs : []);
      } catch {}
    })();
  }, []);

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
                Pricing
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Simple plans for different needs
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Choose a plan or start free. You can update later.
              </p>
              <Button size="lg" asChild>
                <a href="#plans">
                  View plans
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </motion.div>
          </div>
        </Background>
      </section>

      {/* Pricing Plans */}
      <section id="plans" className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Pricing Plans</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose what fits today. You can change plans later.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[...plans].sort((a, b) => {
              const aHas = typeof a.amount === 'number' && !Number.isNaN(a.amount as number);
              const bHas = typeof b.amount === 'number' && !Number.isNaN(b.amount as number);
              if (aHas && bHas) return (a.amount as number) - (b.amount as number);
              if (aHas && !bHas) return -1;
              if (!aHas && bHas) return 1;
              return 0;
            }).map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <Card className={`h-full flex flex-col ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{(typeof plan.amount === 'number' && plan.currency) ? `${plan.amount} ${plan.currency}` : plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    {plan.description && (
                      <p className="text-muted-foreground">{plan.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4 flex flex-col flex-1">
                    {Array.isArray(plan.features) && plan.features.length > 0 && (
                      <ul className="space-y-2 flex-1">
                        {plan.features.map((f, idx) => (
                          <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button 
                      className="w-full mt-auto" 
                      variant={plan.popular ? "default" : "outline"}
                      disabled={!!loadingPlan && loadingPlan === plan.name}
                      onClick={async () => {
                        if (!plan.stripePriceId) {
                          window.location.href = '/contact';
                          return;
                        }
                        try {
                          setLoadingPlan(plan.name);
                          const res = await fetch('/api/payments/stripe/checkout', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              priceId: plan.stripePriceId,
                              paymentType: plan.paymentType || 'subscription'
                            })
                          });
                          const json = await res.json();
                          if (res.ok && json?.url) {
                            window.location.href = json.url as string;
                          } else {
                            window.location.href = '/contact';
                          }
                        } catch {
                          window.location.href = '/contact';
                        } finally {
                          setLoadingPlan(null);
                        }
                      }}
                    >
                      {loadingPlan === plan.name ? 'Redirecting...' : (plan.cta || 'Choose plan')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about our pricing and plans.
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-3">
            {faqs.map((faq: FAQ, index) => {
              const open = openFaqs.has(index);
              return (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                >
                  <Card>
                    <button
                      className="w-full text-left p-6 flex items-center justify-between"
                      onClick={() =>
                        setOpenFaqs((prev) => {
                          const next = new Set(prev);
                          if (next.has(index)) next.delete(index); else next.add(index);
                          return next;
                        })
                      }
                    >
                      <span className="font-semibold pr-6">{faq.question}</span>
                      <span className="text-sm text-muted-foreground">{open ? 'Hide' : 'Show'}</span>
                    </button>
                    {open && (
                      <CardContent className="pt-0 px-6 pb-6 -mt-2">
                        <p className="text-muted-foreground">{faq.answer}</p>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pt-12 pb-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-12">
                <CircleHelp className="mx-auto mb-4 h-12 w-12 text-primary" />
                <h2 className="text-3xl font-bold mb-6">Have a question about plans?</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Reach out and we’ll help you choose.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <a href="/contact">
                      Contact Us
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="/community">Join the Community</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}