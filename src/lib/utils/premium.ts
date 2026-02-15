import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';

/**
 * Check if the current user has premium access
 * @returns boolean indicating if user has premium access
 */
export async function isUserPremium(): Promise<boolean> {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return false;
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { 
        role: true, 
        premiumExpires: true,
        stripeSubscriptionId: true
      }
    });

    if (!user) {
      return false;
    }

    // Check if user has premium role and premium access hasn't expired
    if (user.role === UserRole.PREMIUM_USER) {
      if (user.premiumExpires) {
        return new Date() < user.premiumExpires;
      }
      // If no expiration date, assume premium is permanent
      return true;
    }

    // Check if user has active Stripe subscription
    if (user.stripeSubscriptionId) {
      // In a real implementation, you would verify the subscription status with Stripe
      // For now, we'll assume if there's a subscription ID, it's active
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}

/**
 * Get premium status details for the current user
 * @returns Object with premium status and expiration information
 */
export async function getPremiumStatus() {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.email) {
      return {
        isPremium: false,
        role: 'GUEST',
        premiumExpires: null,
        hasActiveSubscription: false,
        daysRemaining: 0
      };
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { 
        role: true, 
        premiumExpires: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true
      }
    });

    if (!user) {
      return {
        isPremium: false,
        role: 'GUEST',
        premiumExpires: null,
        hasActiveSubscription: false,
        daysRemaining: 0
      };
    }

    const isPremium = user.role === UserRole.PREMIUM_USER;
    const hasActiveSubscription = !!user.stripeSubscriptionId;
    
    let daysRemaining = 0;
    if (user.premiumExpires) {
      const now = new Date();
      const expires = new Date(user.premiumExpires);
      const diffTime = expires.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    return {
      isPremium,
      role: user.role,
      premiumExpires: user.premiumExpires,
      hasActiveSubscription,
      daysRemaining,
      stripeCustomerId: user.stripeCustomerId
    };
  } catch (error) {
    console.error('Error getting premium status:', error);
    return {
      isPremium: false,
      role: 'ERROR',
      premiumExpires: null,
      hasActiveSubscription: false,
      daysRemaining: 0
    };
  }
}

/**
 * Grant premium access to a user for a specified duration
 * @param userEmail - User's email address
 * @param days - Number of days to grant premium access
 * @returns Updated user record
 */
export async function grantPremiumAccess(userEmail: string, days: number = 30) {
  try {
    const premiumExpires = new Date();
    premiumExpires.setDate(premiumExpires.getDate() + days);

    const updatedUser = await db.user.update({
      where: { email: userEmail },
      data: {
        role: UserRole.PREMIUM_USER,
        premiumExpires
      }
    });

    return updatedUser;
  } catch (error) {
    console.error('Error granting premium access:', error);
    throw new Error('Failed to grant premium access');
  }
}

/**
 * Revoke premium access from a user
 * @param userEmail - User's email address
 * @returns Updated user record
 */
export async function revokePremiumAccess(userEmail: string) {
  try {
    const updatedUser = await db.user.update({
      where: { email: userEmail },
      data: {
        role: UserRole.FREE_USER,
        premiumExpires: null
      }
    });

    return updatedUser;
  } catch (error) {
    console.error('Error revoking premium access:', error);
    throw new Error('Failed to revoke premium access');
  }
}

/**
 * Extend premium access for a user
 * @param userEmail - User's email address
 * @param days - Number of additional days to extend premium access
 * @returns Updated user record
 */
export async function extendPremiumAccess(userEmail: string, days: number = 30) {
  try {
    const user = await db.user.findUnique({
      where: { email: userEmail },
      select: { premiumExpires: true }
    });

    let premiumExpires = new Date();
    
    // If user already has premium access, extend from current expiration
    if (user?.premiumExpires && new Date() < user.premiumExpires) {
      premiumExpires = new Date(user.premiumExpires);
    }
    
    premiumExpires.setDate(premiumExpires.getDate() + days);

    const updatedUser = await db.user.update({
      where: { email: userEmail },
      data: {
        role: UserRole.PREMIUM_USER,
        premiumExpires
      }
    });

    return updatedUser;
  } catch (error) {
    console.error('Error extending premium access:', error);
    throw new Error('Failed to extend premium access');
  }
}

/**
 * Check if a user can access premium content
 * @param userId - User's ID
 * @returns boolean indicating if user can access premium content
 */
export async function canAccessPremiumContent(userId: string): Promise<boolean> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { 
        role: true, 
        premiumExpires: true,
        stripeSubscriptionId: true
      }
    });

    if (!user) {
      return false;
    }

    // Check if user has premium role and premium access hasn't expired
    if (user.role === UserRole.PREMIUM_USER) {
      if (user.premiumExpires) {
        return new Date() < user.premiumExpires;
      }
      return true;
    }

    // Check if user has active Stripe subscription
    return !!user.stripeSubscriptionId;
  } catch (error) {
    console.error('Error checking premium content access:', error);
    return false;
  }
}

/**
 * Get premium content teaser for free users
 * @param content - Full content
 * @param teaserLength - Length of teaser in characters (default: 200)
 * @returns Teaser content
 */
export function getPremiumTeaser(content: string, teaserLength: number = 200): string {
  // Remove HTML tags if present
  const plainText = content.replace(/<[^>]*>/g, '');
  
  // Get teaser
  let teaser = plainText.substring(0, teaserLength);
  
  // Add ellipsis if content is longer than teaser
  if (plainText.length > teaserLength) {
    teaser += '...';
  }
  
  return teaser;
}