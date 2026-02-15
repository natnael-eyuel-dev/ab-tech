"use client";

import { ThemeProvider } from "@/components/shared/theme-provider";
import { Providers } from "@/components/shared/providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Loading from "@/app/loading";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Listen to route changes
  useEffect(() => {
    if (!router) return;

    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);
    const handleError = () => setIsLoading(false);

  // These events exist on Next.js's Router (client)
  // @ts-expect-error - router.events is not typed on the App Router's navigation object, but exists at runtime in client
  router.events?.on("routeChangeStart", handleStart);
  // @ts-expect-error - router.events is not typed on the App Router's navigation object, but exists at runtime in client
  router.events?.on("routeChangeComplete", handleComplete);
  // @ts-expect-error - router.events is not typed on the App Router's navigation object, but exists at runtime in client
  router.events?.on("routeChangeError", handleError);

    return () => {
  // @ts-expect-error - runtime-only events on router
  router.events?.off("routeChangeStart", handleStart);
  // @ts-expect-error - runtime-only events on router
  router.events?.off("routeChangeComplete", handleComplete);
  // @ts-expect-error - runtime-only events on router
  router.events?.off("routeChangeError", handleError);
    };
  }, [router]);

  // Extra safety: reset loader when pathname updates
  useEffect(() => {
    setIsLoading(false);
  }, [pathname]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Providers>
        {/* Global Loader */}
        {isLoading && (
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-background"
            style={{
              width: "100vw",
              height: "100vh",
              overflow: "hidden",
              touchAction: "none",
              pointerEvents: "none",
            }}
          >
            <div className="pointer-events-none flex items-center justify-center w-full h-full">
              <Loading />
            </div>
          </div>
        )}

        {/* Layout */}
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>

        <Toaster />
      </Providers>
    </ThemeProvider>
  );
}
