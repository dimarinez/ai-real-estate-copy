// src/app/api/stripe/webhook/route.ts
import { Stripe } from 'stripe';
import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db'; // Adjust path
import User, { IUser } from '../../../models/User'; // Adjust path

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

const VALID_PLANS = ['basic', 'pro'] as const;
type PlanType = typeof VALID_PLANS[number];

export async function POST(req: Request) {
  console.log('=== Webhook Request Received ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers));
  console.log('============================');

  try {
    // Get raw body as text
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    console.log('Raw Body Sample:', body.slice(0, 200));
    console.log('Stripe-Signature:', sig || 'No signature');

    if (!sig) {
      throw new Error('No Stripe signature found');
    }

    const event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    console.log('Event received:', event.type, 'ID:', event.id);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(
          'Checkout Session Completed:',
          JSON.stringify(
            {
              id: session.id,
              metadata: session.metadata,
            },
            null,
            2
          )
        );

        const { userId, chosenPlan } = session.metadata || {};

        if (!userId) {
          console.error('Missing userId in session metadata');
          return NextResponse.json(
            { error: 'Missing userId in session metadata' },
            { status: 400 }
          );
        }

        const validatedPlan: PlanType = VALID_PLANS.includes(chosenPlan as PlanType)
          ? (chosenPlan as PlanType)
          : 'basic';

        await connectDB();
        const user = (await User.findById(userId)) as IUser | null;

        if (!user) {
          console.error(`User ${userId} not found`);
          return NextResponse.json({ error: `User ${userId} not found` }, { status: 404 });
        }

        user.subscriptionStatus = validatedPlan;
        await user.save();
        console.log(`✅ Updated user ${userId} to ${validatedPlan}`);
        break;

      case 'invoice.payment_succeeded':
        console.log('Invoice payment succeeded:', event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error verifying webhook signature:', errorMessage);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }
}