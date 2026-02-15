"use client"

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Eye, 
  Database, 
  Cookie,
  FileText,
  Lock,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Background } from "@/components/shared/Background";

export default function PrivacyPolicyClient() {
  const sections = [
    {
      icon: Shield,
      title: "Information We Collect",
      content: [
        "Personal identification information (Name, email address, etc.)",
        "Device and browser information",
        "IP address and location data",
        "Cookies and tracking technologies",
        "User preferences and interaction data"
      ]
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content: [
        "To provide and maintain our service",
        "To send you newsletters and updates",
        "To improve our content and user experience",
        "To analyze website traffic and usage patterns",
        "To communicate with you about your account"
      ]
    },
    {
      icon: Database,
      title: "Data Storage and Security",
      content: [
        "All data is encrypted in transit and at rest",
        "We use industry-standard security measures",
        "Regular security audits and updates",
        "Limited access to personal information",
        "Secure backup and disaster recovery procedures"
      ]
    },
    {
      icon: Cookie,
      title: "Cookies and Tracking",
      content: [
        "Essential cookies for website functionality",
        "Analytics cookies to understand user behavior",
        "Marketing cookies for personalized content",
        "You can control cookie preferences in your browser",
        "Cookie consent is required for non-essential cookies"
      ]
    },
    {
      icon: FileText,
      title: "Your Rights and Choices",
      content: [
        "Right to access your personal information",
        "Right to correct inaccurate data",
        "Right to delete your information",
        "Right to opt-out of marketing communications",
        "Right to data portability"
      ]
    },
    {
      icon: Lock,
      title: "Third-Party Services",
      content: [
        "We use trusted third-party services for analytics",
        "Email delivery and newsletter services",
        "Cloud hosting and infrastructure providers",
        "Payment processing services",
        "All third parties are bound by strict data protection agreements"
      ]
    }
  ];

  const { toast } = useToast();

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copied`,
      description: `${text} has been copied to your clipboard.`,
    });
  };

  const lastUpdated = "2025-09-19"; 

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <Background overlayOpacity={0.6}>
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge variant="secondary" className="mb-4">
                Privacy Policy
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Your Privacy is Our
                <span className="text-primary"> Priority</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                We are committed to protecting your personal information and being transparent 
                about how we collect, use, and share your data.
              </p>
            </motion.div>
          </div>
        </Background>
      </section>

      {/* Last Updated */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date(lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-16"
            >
              <h2 className="text-2xl font-bold mb-6">Introduction</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Welcome to ABTech. This Privacy Policy explains how we collect, use, disclose, 
                  and safeguard your personal information when you visit our website, use our services, 
                  or interact with us in other ways.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  By using ABTech, you agree to the collection and use of information in accordance 
                  with this policy. We are committed to protecting your privacy and ensuring that your 
                  personal information is handled in a safe and responsible manner.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at 
                  abtechspace@gmail.com.
                </p>
              </div>
            </motion.div>

            {/* Policy Sections */}
            <div className="space-y-12">
              {sections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <section.icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{section.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {section.content.map((item, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <span className="text-muted-foreground">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* International Users */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-16"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Globe className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">International Users</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    ABTech is hosted and operated in the Ethiopia. If you are accessing our 
                    services from outside the Ethiopia, please be aware that your information 
                    may be transferred to, stored, and processed in the Ethiopia and other 
                    countries where our service providers operate.
                  </p>
                  <p className="text-muted-foreground">
                    By using our services, you consent to this transfer and processing of your 
                    information in accordance with this Privacy Policy.
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Changes to This Policy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-12"
            >
              <h2 className="text-2xl font-bold mb-6">Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our 
                practices or for operational, legal, or regulatory reasons. The updated policy 
                will be effective when posted on this page with a revised "Last Updated" date.
              </p>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-12"
            >
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions, concerns, or requests regarding this Privacy Policy 
                or our data practices, please contact us at:
              </p>
              <div className="mt-6 p-6 bg-muted/50 rounded-xl border shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <p className="font-medium w-20">Email:</p>
                  <button
                    className="text-primary hover:underline"
                    onClick={() => handleCopy("abtechspace@gmail.com", "Email")}
                  >
                    abtechspace@gmail.com
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-medium w-20">Phone:</p>
                  <button
                    className="text-primary hover:underline"
                    onClick={() => handleCopy("+251921535412", "Phone")}
                  >
                    +251 921 535 412
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}