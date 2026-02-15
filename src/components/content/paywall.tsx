"use client";

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Crown, 
  User, 
  BookOpen, 
  Star, 
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';

interface PaywallProps {
  reason: 'authentication_required' | 'premium_required' | 'limit_reached' | 'upgrade_required';
  previewContent?: string;
  remainingArticles?: number;
  articleTitle?: string;
}

export function Paywall({ reason, previewContent, remainingArticles, articleTitle }: PaywallProps) {
  const { data: session } = useSession();

  const getPaywallContent = () => {
    switch (reason) {
      case 'authentication_required':
        return {
          title: 'Sign In to Continue Reading',
          description: 'Create a free account to access this article and more premium content.',
          icon: User,
          color: 'blue',
          actions: [
            { text: 'Sign In Free', href: '/auth/signin', variant: 'default' as const, primary: true },
            { text: 'Create Account', href: '/auth/signup', variant: 'outline' as const, primary: false },
          ],
          features: [
            'Access to 15 free articles per month',
            'Save articles for later reading',
            'Personalized content recommendations',
            'Comment on articles',
          ],
        };

      case 'premium_required':
        return {
          title: 'Premium Content',
          description: 'This article is exclusive to our premium members.',
          icon: Crown,
          color: 'yellow',
          actions: [
            { text: 'Upgrade to Premium', href: '/billing', variant: 'default' as const, primary: true },
            { text: 'View Plans', href: '/pricing', variant: 'outline' as const, primary: false },
          ],
          features: [
            'Unlimited access to all articles',
            'Exclusive premium content',
            'Ad-free reading experience',
            'Early access to new content',
            'Downloadable resources',
            'Expert Q&A sessions',
          ],
        };

      case 'limit_reached':
        return {
          title: 'Free Article Limit Reached',
          description: remainingArticles === 0 
            ? 'You have reached your monthly limit of free articles.'
            : `You have ${remainingArticles} free articles remaining this month.`,
          icon: BookOpen,
          color: 'orange',
          actions: [
            { text: 'Upgrade to Premium', href: '/billing', variant: 'default' as const, primary: true },
            { text: 'Create Free Account', href: '/auth/signup', variant: 'outline' as const, primary: false },
          ],
          features: [
            'Unlimited article access',
            'No monthly limits',
            'Access to exclusive content',
            'Support quality journalism',
          ],
        };

      case 'upgrade_required':
        return {
          title: 'Upgrade for Unlimited Access',
          description: 'You have reached your registered user limit. Upgrade to premium for unlimited access.',
          icon: Crown,
          color: 'purple',
          actions: [
            { text: 'Upgrade Now', href: '/billing', variant: 'default' as const, primary: true },
            { text: 'View Plans', href: '/pricing', variant: 'outline' as const, primary: false },
          ],
          features: [
            'Unlimited articles every month',
            'Premium exclusive content',
            'Ad-free experience',
            'Priority support',
          ],
        };

      default:
        return {
          title: 'Access Restricted',
          description: 'Please sign in or upgrade to access this content.',
          icon: Lock,
          color: 'gray',
          actions: [
            { text: 'Sign In', href: '/auth/signin', variant: 'default' as const, primary: true },
            { text: 'View Plans', href: '/pricing', variant: 'outline' as const, primary: false },
          ],
          features: [
            'Access to quality content',
            'Support independent journalism',
            'Join our community',
          ],
        };
    }
  };

  const content = getPaywallContent();
  const Icon = content.icon;

  const colorClasses: Record<
    string,
    { gradient: string; pillBg: string; icon: string }
  > = {
    blue: {
      gradient: "from-blue-500/10 to-blue-600/5",
      pillBg: "bg-blue-100 dark:bg-blue-900/20",
      icon: "text-blue-600 dark:text-blue-400",
    },
    yellow: {
      gradient: "from-yellow-500/10 to-yellow-600/5",
      pillBg: "bg-yellow-100 dark:bg-yellow-900/20",
      icon: "text-yellow-600 dark:text-yellow-400",
    },
    orange: {
      gradient: "from-orange-500/10 to-orange-600/5",
      pillBg: "bg-orange-100 dark:bg-orange-900/20",
      icon: "text-orange-600 dark:text-orange-400",
    },
    purple: {
      gradient: "from-purple-500/10 to-purple-600/5",
      pillBg: "bg-purple-100 dark:bg-purple-900/20",
      icon: "text-purple-600 dark:text-purple-400",
    },
    gray: {
      gradient: "from-gray-500/10 to-gray-600/5",
      pillBg: "bg-gray-100 dark:bg-gray-900/20",
      icon: "text-gray-600 dark:text-gray-400",
    },
  };

  const cc = colorClasses[content.color] || colorClasses.gray;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* Preview Content */}
      {previewContent && (
        <Card className="mb-6 border-dashed border-2 border-muted-foreground/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Article Preview</span>
            </div>
            <p className="text-muted-foreground italic">{previewContent}</p>
          </CardContent>
        </Card>
      )}
      {/* Main Paywall Card */}
      <Card className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${cc.gradient}`} />
        
        <CardHeader className="relative z-10 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${cc.pillBg}`}>
              <Icon className={`h-8 w-8 ${cc.icon}`} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{content.title}</CardTitle>
          <CardDescription className="text-lg max-w-2xl mx-auto">
            {content.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6">
          {/* Features List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
              >
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {content.actions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Button
                  variant={action.variant}
                  size="lg"
                  className={action.primary ? 'w-full sm:w-auto' : 'w-full sm:w-auto'}
                >
                  {action.text}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Cancel Anytime</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>30-Day Guarantee</span>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Alternative Options */}
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-primary hover:underline">
            Sign in here
          </Link>
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">
            <Star className="h-3 w-3 mr-1" />
            50K+ Readers
          </Badge>
          <Badge variant="outline">
            <BookOpen className="h-3 w-3 mr-1" />
            500+ Articles
          </Badge>
          <Badge variant="outline">
            <User className="h-3 w-3 mr-1" />
            100+ Experts
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}