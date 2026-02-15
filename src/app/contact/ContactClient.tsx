"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Background } from "@/components/shared/Background";
import { Mail, Phone, Send, CheckCircle, ChevronDown, ChevronRight, HelpCircle, Users } from "lucide-react";

export default function ContactClient() {
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/contact/faqs');
        const json = await res.json();
        if (!cancelled) setFaqs(Array.isArray(json.faqs) ? json.faqs : []);
      } catch {}
    })();
    return () => { cancelled = true };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const contactInfo = [
    { icon: Mail, title: "Email Us", details: ["abtechspace@gmail.com"], description: "For general inquiries and support" },
    { icon: Phone, title: "Call Us", details: ["+251 921 535 412"], description: "Monday to Friday, 9 AM - 9 PM PST" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative">
        <Background overlayOpacity={0.6}>
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge variant="secondary" className="mb-4">Contact Us</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Get in<span className="text-primary"> Touch</span></h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Have questions, feedback, or want to collaborate? We'd love to hear from you.
                Reach out and we'll get back to you as soon as possible.
              </p>
            </motion.div>
            <div className="container mx-auto px-4 pt-12">
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="outline" asChild>
                  <a href="/help">Browse Help Center</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/community">Ask the Community</a>
                </Button>
              </div>
            </div>
          </div>
        </Background>
      </section>
        
      {/* Contact Info Section */}
      <section className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Contact Information</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Reach us via email or phone. We usually respond within one business day.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {contactInfo.map((info, index) => (
              <motion.div key={info.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }}>
                <Card className="h-full text-center">
                  <CardHeader>
                    <div className="p-3 bg-primary/10 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <info.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{info.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{info.description}</p>
                    {info.details.map((detail, idx) => (
                      <p key={idx} className="text-sm font-medium">{detail}</p>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form + FAQ */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Get Support</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Send us an email or browse FAQs for instant answers.
              </p>
            </motion.div>
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Form */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Send us a message</CardTitle>
                    <p className="text-muted-foreground">Fill out the form below and we'll get back to you within 24 hours.</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isSubmitted && (
                      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <p className="text-green-800 font-medium">Message sent successfully!</p>
                        </div>
                        <p className="text-green-700 text-sm mt-1">We'll get back to you soon.</p>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid md:grid-cols-2 gap-5">
                        <div>
                          <Label className="mb-3" htmlFor="name">Name *</Label>
                          <Input id="name" name="name" type="text" required value={formData.name} onChange={handleChange} placeholder="John Doe" />
                        </div>
                        <div>
                          <Label className="mb-3" htmlFor="email">Email *</Label>
                          <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="john@example.com" />
                        </div>
                      </div>

                      <div>
                        <Label className="mb-3" htmlFor="subject">Subject *</Label>
                        <Input id="subject" name="subject" type="text" required value={formData.subject} onChange={handleChange} placeholder="How can we help you?" />
                      </div>

                      <div>
                        <Label className="mb-3" htmlFor="message">Message *</Label>
                        <Textarea id="message" name="message" required value={formData.message} onChange={handleChange} placeholder="Tell us more about your inquiry..." className="min-h-[120px]" />
                      </div>

                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Sending...' : (<><span>Send Message</span><Send className="ml-2 h-4 w-4" /></>)}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* FAQ */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                <div>
                  <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                  <div className="space-y-3">
                    {faqs.length === 0 && (
                      <p className="text-sm text-muted-foreground">No FAQs yet.</p>
                    )}
                    {faqs.map((faq, idx) => (
                      <Card key={idx}>
                        <CardContent className="pt-4">
                          <button
                            type="button"
                            className="w-full flex items-center justify-between text-left"
                            onClick={() => setOpenFaqs((prev) => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; })}
                          >
                            <span className="font-semibold pr-4">{faq.question}</span>
                            {openFaqs.has(idx) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          {openFaqs.has(idx) && (
                            <p className="text-sm text-muted-foreground mt-3">{faq.answer}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
                    <h3 className="font-semibold mb-2">Need immediate help?</h3>
                    <p className="text-sm text-muted-foreground mb-4">For urgent matters, please call us directly at +251 921 535 412 during business hours.</p>
                    <Button variant="outline" asChild>
                      <a href="tel:+251921535412"><Phone className="mr-2 h-4 w-4" />Call Now</a>
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="pt-12 pb-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-md transition-shadow">
              <CardContent className="p-12">
                <HelpCircle className="h-16 w-16 text-primary mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-6">Still Need Help?</h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Can't find what you're looking for? Our support team is here to help you 
                  with any questions or issues you might have.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild>
                    <a href="/contact">
                      <Mail className="mr-2 h-4 w-4" />
                      Contact Support
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="/community">
                      <Users className="mr-2 h-4 w-4" />
                      Ask Community
                    </a>
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
