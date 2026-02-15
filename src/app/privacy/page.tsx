import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - ABTech",
  description: "Read ABTech's privacy policy to understand how we collect, use, and protect your personal information.",
  openGraph: {
    title: "Privacy Policy - ABTech",
    description: "Read ABTech's privacy policy to understand how we collect, use, and protect your personal information.",
    type: "website",
  },
};

import PrivacyPolicyClient from "./PrivacyClient";

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />
}