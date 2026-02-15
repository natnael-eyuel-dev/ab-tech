"use client";

import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface AccessIndicatorProps {
  className?: string;
  variant?: string;
}

export function AccessIndicator({ className }: AccessIndicatorProps) {
  const { data: session } = useSession();
  const [articleViews, setArticleViews] = useState(0);
  const [remainingArticles, setRemainingArticles] = useState(0);
  // Normalize role to a plain string to avoid strict union comparisons from next-auth types
  const userRole = String(session?.user?.role ?? 'ANONYMOUS');

  useEffect(() => {
    // Get article views from cookies
    const load = () => {
      const views = parseInt(
        document.cookie
          .split('; ')
          .find(row => row.startsWith('article_views='))
          ?.split('=')[1] || '0'
      );

      setArticleViews(views);

      // Calculate remaining articles based on user role
      const limit = userRole === 'PREMIUM_USER' ? -1 :
        (userRole === 'FREE_USER' || userRole === 'AUTHOR') ? 15 : 3;

      setRemainingArticles(limit === -1 ? -1 : Math.max(0, limit - views));
    };

    load();

    // Update when server refreshes cookie
    const onUpdated = () => load();
    window.addEventListener('articleViewsUpdated', onUpdated);
    return () => window.removeEventListener('articleViewsUpdated', onUpdated);
  }, [session, userRole]);

  // Ultra minimal - only show when necessary
  const baseClasses = `text-xs ${className || ''}`;
  
  // Premium users get a tiny crown indicator
  if (userRole === 'PREMIUM_USER') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={baseClasses}
      >
        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
          <Crown className="h-3 w-3" />
          <span>Premium</span>
        </div>
      </motion.div>
    );
  }

  // Free users - only show when they're about to run out or have run out
  if (userRole === 'FREE_USER' || userRole === 'AUTHOR') {
    const shouldShow = remainingArticles <= 3; // Only show when 3 or fewer articles left
    
    if (!shouldShow) {
      return null; // Don't show anything if they have plenty of articles left
    }
    
    const isCritical = remainingArticles === 0;
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={baseClasses}
      >
        <div className="flex items-center gap-2">
          {isCritical ? (
            <Link href="/billing">
              <Button size="sm" variant="ghost" className="h-5 text-xs px-1 py-0 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                Upgrade for unlimited
              </Button>
            </Link>
          ) : (
            <span className="text-muted-foreground">
              {remainingArticles} article{remainingArticles !== 1 ? 's' : ''} left this month
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  // Anonymous users - only show when they're about to run out or have run out
  const shouldShow = remainingArticles <= 1; // Only show when 1 or 0 articles left
  
  if (!shouldShow) {
    return null; // Don't show anything if they have articles left
  }
  
  const isCritical = remainingArticles === 0;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={baseClasses}
    >
      <div className="flex items-center gap-2">
        {isCritical ? (
          <Link href="/auth/signup">
            <Button size="sm" variant="ghost" className="h-5 text-xs px-1 py-0 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20">
              Sign up for more articles
            </Button>
          </Link>
        ) : (
          <span className="text-muted-foreground">
            {remainingArticles} free article{remainingArticles !== 1 ? 's' : ''} left
          </span>
        )}
      </div>
    </motion.div>
  );
}