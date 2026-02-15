import Link from "next/link";
import { ABTECHLogo } from "../shared/abtech-logo";
import { FooterBackground } from "../shared/FooterBackground";
import { 
  Twitter, 
  Linkedin, 
  Github, 
  Mail, 
  Rss,
  ArrowRight 
} from "lucide-react";
import { NewsletterFooterClient } from "./NewsletterFooterClient";

const footerLinks = {
  product: [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
    { name: "Courses", href: "/courses" },
  ],
  resources: [
    { name: "Community", href: "/community" },
    { name: "Help Center", href: "/help" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

const socialLinks = [
  { name: "Twitter", href: "https://twitter.com", icon: Twitter },
  { name: "LinkedIn", href: "https://linkedin.com", icon: Linkedin },
  { name: "GitHub", href: "https://github.com", icon: Github },
  { name: "Email", href: "mailto:abtechspace@gmail.com", icon: Mail },
  { name: "RSS", href: "/rss.xml", icon: Rss },
];

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <FooterBackground>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
            {/* Brand */}
            <div className="lg:col-span-2">
              <ABTECHLogo size="sm"/>
              <p className="mb-4 max-w-md text-sm text-muted-foreground">
                Stay ahead with the latest technology news, insights, and trends. 
                Your trusted source for tech innovation and startup stories.
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      target="_blank"
                      rel="noopener noreferrer">
                      <Icon className="h-5 w-5" />
                      <span className="sr-only">{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold">Product</h3>
              <ul className="space-y-2 text-sm">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold">Company</h3>
              <ul className="space-y-2 text-sm">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold">Resources</h3>
              <ul className="space-y-2 text-sm">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="mt-12 border-t pt-8">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <div>
                <h3 className="text-lg font-semibold">Subscribe to our newsletter</h3>
                <p className="text-sm text-muted-foreground">
                  Get the latest posts delivered right to your inbox.
                </p>
              </div>
              <NewsletterFooterClient />
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 ABTech. All rights reserved.</p>
          </div>
        </div>
      </FooterBackground>
    </footer>
  );
}