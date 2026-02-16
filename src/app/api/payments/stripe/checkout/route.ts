import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';
import Stripe from 'stripe';

// Lazy-initialize Stripe to avoid build-time errors when STRIPE_SECRET_KEY is not set
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-12-18' as any,
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, paymentType } = await request.json();

    if (!priceId || !paymentType) {
      return NextResponse.json({ 
        error: 'Price ID and payment type are required' 
      }, { status: 400 });
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize Stripe
    const stripe = getStripe();

    // Create or get Stripe customer
    let stripeCustomer;
    if (user.stripeCustomerId) {
      stripeCustomer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id
        }
      });

      // Update user with Stripe customer ID
      await db.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: stripeCustomer.id }
      });
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      mode: paymentType === 'subscription' ? 'subscription' : 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/billing?canceled=true`,
      metadata: {
        userId: user.id,
        paymentType,
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Collect billing address for subscriptions
      billing_address_collection: paymentType === 'subscription' ? 'required' : 'auto',
    });

    // Create payment record
    await db.payment.create({
      data: {
        userId: user.id,
        amount: 0, // Will be updated by webhook
        currency: 'USD',
        method: 'STRIPE',
        status: 'PENDING',
        type: paymentType.toUpperCase(),
        stripePaymentIntentId: checkoutSession.payment_intent as string,
        metadata: JSON.stringify({
          priceId,
          paymentType,
          stripeCheckoutSessionId: checkoutSession.id
        })
      }
    });

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url 
    });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json({ 
      error: 'Failed to create checkout session' 
    }, { status: 500 });
  }
}