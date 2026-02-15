"use client";

import { useCallback, useEffect, useState } from "react";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const LS_EMAIL_KEY = "abtech:newsletter:email";
const LS_STATUS_KEY = "abtech:newsletter:status";

export function useNewsletter() {
  const [email, setEmail] = useState("");
  // status: 'none' | 'pending' | 'verified'
  const [status, setStatus] = useState<"none" | "pending" | "verified">("none");
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear local form (no localStorage usage)
  const clear = useCallback(() => {
    // Only clear form inputs; keep persisted subscription so other areas still reflect state
    setEmail("");
    setError(null);
  }, []);

  // Initialize from localStorage and verify server-side if possible
  useEffect(() => {
    try {
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem(LS_EMAIL_KEY) : null;
      const savedStatus = typeof window !== "undefined" ? (localStorage.getItem(LS_STATUS_KEY) as any) : null;
      if (savedEmail && isValidEmail(savedEmail)) {
        setEmail(savedEmail);
      }
      if (savedStatus === "verified" || savedStatus === "pending") {
        setStatus(savedStatus);
      }
      // Always attempt to refresh status from server (session-aware when no email provided)
      (async () => {
        try {
          setIsChecking(true);
          const q = savedEmail ? `?email=${encodeURIComponent(savedEmail)}` : "";
          const res = await fetch(`/api/newsletter/status${q}`);
          const data = await res.json().catch(() => ({}));
          if (res.ok && data?.status) {
            setStatus(data.status);
            if (savedEmail && (data.status === "verified" || data.status === "pending")) {
              localStorage.setItem(LS_EMAIL_KEY, savedEmail);
              localStorage.setItem(LS_STATUS_KEY, data.status);
            }
          }
        } catch {}
        finally {
          setIsChecking(false);
        }
      })();
    } catch {}
  }, []);

  const subscribe = useCallback(async (inputEmail?: string, opts?: { captchaToken?: string | null, honeypot?: string }) => {
    const e = (inputEmail ?? email).trim();
    setError(null);
    if (!e) {
      setError("Please enter your email address");
      return { ok: false, message: "Please enter your email address" };
    }
    if (!isValidEmail(e)) {
      setError("Please enter a valid email address");
      return { ok: false, message: "Please enter a valid email address" };
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, captchaToken: opts?.captchaToken ?? null, honeypot: opts?.honeypot ?? "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Subscription failed");
      }
      setEmail(e);
      // backend now uses pending verification
      if (data?.pending) {
        setStatus("pending");
        try {
          localStorage.setItem(LS_EMAIL_KEY, e);
          localStorage.setItem(LS_STATUS_KEY, "pending");
        } catch {}
        return { ok: true, pending: true };
      }
      if (data?.alreadySubscribed) {
        setStatus("verified");
        try {
          localStorage.setItem(LS_EMAIL_KEY, e);
          localStorage.setItem(LS_STATUS_KEY, "verified");
        } catch {}
        return { ok: true, alreadySubscribed: true };
      }
      // Fallback
      setStatus("pending");
      try {
        localStorage.setItem(LS_EMAIL_KEY, e);
        localStorage.setItem(LS_STATUS_KEY, "pending");
      } catch {}
      return { ok: true, pending: true };
    } catch (err: any) {
      setError(err?.message || "Subscription failed");
      return { ok: false, message: err?.message || "Subscription failed" };
    } finally {
      setIsSubmitting(false);
    }
  }, [email]);

  const unsubscribe = useCallback(async (inputEmail?: string, opts?: { captchaToken?: string | null, honeypot?: string }) => {
    const eRaw = (inputEmail ?? email).trim();
    setError(null);
    // If an email is provided but invalid, block. If none provided, let server resolve via session.
    if (eRaw && !isValidEmail(eRaw)) {
      setError("Please enter a valid email address");
      return { ok: false, message: "Please enter a valid email address" };
    }
    const e: string | null = eRaw || null;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, captchaToken: opts?.captchaToken ?? null, honeypot: opts?.honeypot ?? "" }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Unsubscribe failed");
      }
      // clear local persisted state
      setStatus("none");
      try {
        localStorage.removeItem(LS_STATUS_KEY);
        // Keep last used email so UI can still show which email was used previously
        // If you want to fully clear, also remove LS_EMAIL_KEY
      } catch {}
      return { ok: true };
    } catch (err: any) {
      setError(err?.message || "Unsubscribe failed");
      return { ok: false, message: err?.message || "Unsubscribe failed" };
    } finally {
      setIsSubmitting(false);
    }
  }, [email]);

  const checkStatus = useCallback(async (inputEmail?: string) => {
    const e = (inputEmail ?? email).trim();
    setError(null);
    setIsChecking(true);
    try {
      const q = e ? `?email=${encodeURIComponent(e)}` : "";
      const res = await fetch(`/api/newsletter/status${q}`);
      const data = await res.json();
      if (res.ok && data?.status) {
        setStatus(data.status);
        return { ok: true, status: data.status };
      }
      return { ok: false };
    } catch (err) {
      return { ok: false };
    } finally {
      setIsChecking(false);
    }
  }, [email]);

  const resendVerification = useCallback(async (inputEmail?: string, opts?: { captchaToken?: string | null, honeypot?: string }) => {
    const e = (inputEmail ?? email).trim();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/newsletter/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e, captchaToken: opts?.captchaToken ?? null, honeypot: opts?.honeypot ?? "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Resend failed");
      return { ok: true };
    } catch (err: any) {
      setError(err?.message || "Resend failed");
      return { ok: false, message: err?.message || "Resend failed" };
    } finally {
      setIsSubmitting(false);
    }
  }, [email]);

  return {
    email,
    setEmail,
    status,
    isChecking,
    isSubmitting,
    error,
    subscribe,
    unsubscribe,
    clear,
    checkStatus,
    resendVerification,
  };
}
