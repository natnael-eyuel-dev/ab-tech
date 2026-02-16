import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import { grantPremiumAccess, extendPremiumAccess } from '@/lib/utils/premium';
import Stripe from 'stripe';

// Lazy-initialize Stripe to avoid build-time errors when STRIPE_SECRET_KEY is not set
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey);
}

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return secret;
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const webhookSecret = getWebhookSecret();
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        if (process.env.NODE_ENV !== "production") {
          console.log(`Unhandled event type: ${event.type}`);
        }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId;
    const paymentType = session.metadata?.paymentType;

    if (!userId || !paymentType) {
      console.error('Missing metadata in checkout session');
      return;
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.error('User not found for checkout session');
      return;
    }

    // Update payment record: find pending payment by user and metadata containing the checkout session id
    await db.payment.updateMany({
      where: {
        userId: userId,
        metadata: { contains: session.id }
      },
      data: {
        status: 'COMPLETED',
        stripePaymentIntentId: session.payment_intent as string
      }
    });

    // Handle subscription vs one-time payment
    if (paymentType === 'subscription' && session.subscription) {
      // Update user with subscription info
      await db.user.update({
        where: { id: userId },
        data: {
          role: UserRole.PREMIUM_USER,
          stripeSubscriptionId: session.subscription as string
        }
      });
    } else if (paymentType === 'payment') {
      // Grant premium access for 30 days for one-time payment
      await grantPremiumAccess(user.email!, 30);
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const stripe = getStripe();
    const invoiceSubscription = (invoice as any).subscription;
    if (!invoiceSubscription) {
      return;
    }

    // Get subscription to find user
    const subscription = await stripe.subscriptions.retrieve(invoiceSubscription as string);
    const customerId = subscription.customer as string;

    // Find user by Stripe customer ID
    const user = await db.user.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      console.error('User not found for invoice payment');
      return;
    }

    const invoicePaymentIntent = (invoice as any).payment_intent as string | undefined;
    // Update payment record
    await db.payment.updateMany({
      where: { 
        stripePaymentIntentId: invoicePaymentIntent,
        userId: user.id
      },
      data: {
        status: 'COMPLETED',
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency.toUpperCase()
      }
    });

    // Ensure user has premium status
    await db.user.update({
      where: { id: user.id },
      data: {
        role: UserRole.PREMIUM_USER,
        stripeSubscriptionId: subscription.id
      }
    });
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const stripe = getStripe();
    const invoiceSubscription = (invoice as any).subscription;
    if (!invoiceSubscription) {
      return;
    }

    // Get subscription to find user
    const subscription = await stripe.subscriptions.retrieve(invoiceSubscription as string);
    const customerId = subscription.customer as string;

    // Find user by Stripe customer ID
    const user = await db.user.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      console.error('User not found for failed invoice payment');
      return;
    }

    const invoicePaymentIntentFailed = (invoice as any).payment_intent as string | undefined;
    // Update payment record
    await db.payment.updateMany({
      where: { 
        stripePaymentIntentId: invoicePaymentIntentFailed,
        userId: user.id
      },
      data: {
        status: 'FAILED'
      }
    });

    // Optionally send notification to user about failed payment
    if (process.env.NODE_ENV !== "production") {
      console.log(`Payment failed for user ${user.id}`);
    }
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;

    // Find user by Stripe customer ID
    const user = await db.user.findFirst({
      where: { stripeCustomerId: customerId }
    });

    if (!user) {
      console.error('User not found for subscription deletion');
      return;
    }

    // Revoke premium access
    await db.user.update({
      where: { id: user.id },
      data: {
        role: UserRole.FREE_USER,
        stripeSubscriptionId: null
      }
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`Subscription cancelled for user ${user.id}`);
    }
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update payment record
    await db.payment.updateMany({
      where: { 
        stripePaymentIntentId: paymentIntent.id
      },
      data: {
        status: 'COMPLETED',
        amount: paymentIntent.amount / 100, // Convert from cents
        currency: paymentIntent.currency.toUpperCase()
      }
    });
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}