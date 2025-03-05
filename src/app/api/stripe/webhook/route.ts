import { Stripe } from 'stripe';
import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import User, { IUser } from '../../../models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia",
});

const VALID_PLANS = ['basic', 'pro'] as const;
type PlanType = typeof VALID_PLANS[number];

class WebhookError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'WebhookError';
  }
}

async function verifyWebhook(body: string, signature: string | null): Promise<Stripe.Event> {
  if (!signature) {
    console.error('No Stripe signature provided');
    throw new WebhookError('Missing Stripe signature', 400);
  }
  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    console.error(`Signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    throw new WebhookError('Invalid Stripe signature', 400);
  }
}

async function handleCheckoutSession(session: Stripe.Checkout.Session): Promise<NextResponse> {
  const { userId, chosenPlan } = session.metadata || {};
  console.log('Session metadata:', session.metadata);

  if (!userId) {
    console.error('Metadata missing userId');
    throw new WebhookError('Missing userId in session metadata', 400);
  }

  const validatedPlan: PlanType = VALID_PLANS.includes(chosenPlan as PlanType)
    ? (chosenPlan as PlanType)
    : 'basic';

  await connectDB();
  const user = await User.findById(userId) as IUser | null;
  if (!user) {
    console.error(`User not found for ID: ${userId}`);
    throw new WebhookError(`User ${userId} not found`, 404);
  }

  user.subscriptionStatus = validatedPlan;
  await user.save();
  console.log(`Updated user ${userId} to plan ${validatedPlan}`);
  return NextResponse.json({ received: true }, { status: 200 });
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const stripeSignature = req.headers.get('stripe-signature');
    const body = await req.text();

    const event = await verifyWebhook(body, stripeSignature);

    switch (event.type) {
      case 'checkout.session.completed':
        return await handleCheckoutSession(event.data.object as Stripe.Checkout.Session);
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return NextResponse.json({ received: true }, { status: 200 });
    }
  } catch (error) {
    const err = error instanceof WebhookError
      ? error
      : new WebhookError('Internal server error', 500);
    console.error(`Webhook error: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
}