import { Stripe } from 'stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from "../../../lib/db"; // Your DB connection
import User from "../../../models/User"; // Your User model

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  let event: Stripe.Event;

  try {
    // Get the Stripe-Signature header using next/headers
    const stripeSignature = (await headers()).get('stripe-signature');

    // Get the raw body as text to preserve exact formatting
    const body = await req.text();

    // Verify the event with the raw body, signature, and secret
    event = stripe.webhooks.constructEvent(
      body,
      stripeSignature as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ Signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  // Successfully constructed event
  console.log('✅ Success:', event.id);

  // Define permitted events
  const permittedEvents: string[] = [
    'checkout.session.completed',
  ];

  if (permittedEvents.includes(event.type)) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          const { userId, chosenPlan } = session.metadata || {};
          console.log(`💰 CheckoutSession completed for user ${userId} with plan ${chosenPlan}`);

          // Update user subscription in the database
          await connectDB();
          const userDoc = await User.findById(userId);
          if (userDoc) {
            userDoc.subscriptionStatus = chosenPlan; // e.g., "basic" or "pro"
            await userDoc.save();
            console.log(`✅ Updated user ${userId} subscription to ${chosenPlan}`);
          } else {
            console.log(`❌ User ${userId} not found`);
          }
          break;
        default:
          throw new Error(`Unhandled event: ${event.type}`);
      }
    } catch (error) {
      console.error(`❌ Handler error:`, error);
      return NextResponse.json(
        { message: 'Webhook handler failed' },
        { status: 500 }
      );
    }
  }

  // Acknowledge receipt of the event
  return NextResponse.json({ message: 'Received' }, { status: 200 });
}