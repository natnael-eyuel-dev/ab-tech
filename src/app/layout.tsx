import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { OrganizationStructuredData, WebsiteStructuredData } from "@/components/shared/structured-data";
import ClientLayout from "@/components/layout/client-layout";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "AB TECH - Latest Technology News & Insights",
  description:
    "Stay ahead with the latest technology news, AI insights, startup stories, and tech trends. Your trusted source for innovation and digital transformation.",
  keywords: ["technology", "AI", "startups", "crypto", "web development", "tech news", "innovation"],
  authors: [{ name: "AB TECH Team" }],
  openGraph: {
    title: "AB TECH - Technology News & Insights",
    description: "Latest technology news, AI insights, and startup stories",
    url: "https://abtech.com",
    siteName: "AB TECH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AB TECH - Technology News & Insights",
    description: "Latest technology news, AI insights, and startup stories",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <OrganizationStructuredData />
        <WebsiteStructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} antialiased bg-background text-foreground`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
