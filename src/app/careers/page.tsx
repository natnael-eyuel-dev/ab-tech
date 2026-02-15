import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers - AB TECH",
  description: "A hub for technology with clarity and curiosity. Explore roles at AB TECH and opportunities from our network.",
  openGraph: {
    title: "Careers - AB TECH",
    description: "A hub for technology with clarity and curiosity. Explore roles at AB TECH and opportunities from our network.",
    type: "website",
  },
};

import CareersClient from "./CareersClient";

export default function CareersPage() {
  return <CareersClient />
}