// app/api/webhooks/stripe/route.ts (assuming App Router)
import { Stripe } from 'stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '../../../lib/db'; // Adjust path
import User, { IUser } from '../../../models/User'; // Adjust path

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Valid subscription plans
const VALID_PLANS = ['basic', 'pro'] as const;
type PlanType = typeof VALID_PLANS[number];

// Error handling utility
class WebhookError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'WebhookError';
  }
}

// Webhook signature verification
async function verifyWebhook(body: string, signature: string | null): Promise<Stripe.Event> {
  if (!signature) {
    throw new WebhookError('Missing Stripe signature', 400);
  }

  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    throw new WebhookError(
      `Signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      400
    );
  }
}

// Handle checkout session completion
async function handleCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  const { userId, chosenPlan } = session.metadata || {};

  if (!userId) {
    throw new WebhookError('Missing userId in session metadata', 400);
  }

  const validatedPlan: PlanType = VALID_PLANS.includes(chosenPlan as PlanType)
    ? (chosenPlan as PlanType)
    : 'basic';

  await connectDB();
  const user = await User.findById(userId) as IUser | null;

  if (!user) {
    throw new WebhookError(`User ${userId} not found`, 404);
  }

  user.subscriptionStatus = validatedPlan;
  await user.save();

  console.log(`✅ Updated user ${userId} to ${validatedPlan}`);
}

// Main handler
export async function POST(req: Request): Promise<NextResponse> {
  console.log('Webhook hit!');

  try {
    const body = await req.text();
    const stripeSignature = (await headers()).get('stripe-signature');

    console.log('Stripe-Signature:', stripeSignature || 'No signature');
    console.log('Raw body:', body.slice(0, 200));

    const event = await verifyWebhook(body, stripeSignature);

    console.log('✅ Success: Event ID:', event.id);
    console.log('Event type:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Session:', JSON.stringify({
          id: session.id,
          metadata: session.metadata,
        }, null, 2));

        await handleCheckoutSession(session);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ message: 'Received' }, { status: 200 });
  } catch (error) {
    const err = error instanceof WebhookError
      ? error
      : new WebhookError('Internal server error', 500);

    console.error(`❌ Error: ${err.message}`);
    return NextResponse.json({ message: err.message }, { status: err.status });
  }
}

// Configuration for raw body
export const config = {
  api: {
    bodyParser: false,
  },
};