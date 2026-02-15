import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - AB TECH",
  description: "Latest technology news, how‑tos, and deep dives from AB TECH writers and engineers.",
  openGraph: {
    title: "Blog - AB TECH",
    description: "Latest technology news, how‑tos, and deep dives from AB TECH writers and engineers.",
    type: "website",
  },
};

import BlogClient from "./BlogClient";

export default function BlogPage() {
  return <BlogClient />
}

