"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNewsletter } from "@/hooks/use-newsletter";
// Captcha removed for newsletter flows per request

export function NewsletterFooterClient() {
  const { toast } = useToast();
  const { email, setEmail, status, isChecking, isSubmitting, subscribe, unsubscribe, clear, resendVerification, error } = useNewsletter();
  // Captcha removed from newsletter UI
  const [hp, setHp] = useState("");
  if (status === "verified") {
      return (
        <div className="flex w-full max-w-sm items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            You're subscribed with <span className="font-medium text-foreground">{email}</span>
          </div>
          <div className="flex items-center gap-2">
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 block"
                disabled={isSubmitting}
                onClick={async () => {
                  const r = await unsubscribe(undefined, { honeypot: hp });
                  if (r.ok) {
                    toast({ title: "Unsubscribed" });
                  } else if (error) {
                    toast({ title: "Unsubscribe failed", description: error, variant: "destructive" });
                  }
                }}
              >
                Unsubscribe
              </Button>
            </div>
          </div>
        </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex w-full max-w-sm items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">Please check your inbox to confirm your subscription for <span className="font-medium text-foreground">{email}</span></div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={isSubmitting}
            onClick={async () => {
              const r = await resendVerification(undefined, { honeypot: hp });
              if (r.ok) {
                toast({ title: "Verification email resent" });
              } else if (error) {
                toast({ title: "Resend failed", description: error, variant: "destructive" });
              }
            }}
          >
            Resend
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="flex w-full max-w-sm gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
  const res = await subscribe(undefined, { honeypot: hp });
        if (res.ok) {
          if ((res as any).pending) {
            toast({ title: "Confirm your subscription", description: `We've sent a confirmation email to ${email}.` });
          } else if ((res as any).alreadySubscribed) {
            toast({ title: "You're already subscribed" });
          } else {
            toast({ title: "Subscribed" });
          }
        } else if (error) {
          toast({ title: "Subscription failed", description: error, variant: "destructive" });
        }
      }}
    >
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {/* Honeypot */}
      <input
        type="text"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
      />
      <Button type="submit" disabled={isSubmitting || isChecking}>
        {isSubmitting || isChecking ? "Please wait" : "Subscribe"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
