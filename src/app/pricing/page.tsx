import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing – AB TECH",
  description: "See available plans and FAQs for AB TECH.",
  openGraph: {
    title: "Pricing – AB TECH",
    description: "See available plans and FAQs for AB TECH.",
    type: "website",
  },
};

import PricingClient from "./PricingClient";

export default function PricingPage() {
  return <PricingClient />
}