import { Stripe } from 'stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from "../../../lib/db";
import User from "../../../models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  console.log("Webhook hit!");
  const stripeSignature = (await headers()).get('stripe-signature');
  console.log("Stripe-Signature:", stripeSignature || "No signature");

  const body = await req.text();
  console.log("Raw body:", body);

  console.log("Webhook secret:", process.env.STRIPE_WEBHOOK_SECRET?.slice(0, 8) + "...");

  let event: Stripe.Event;
  try {
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

  console.log('✅ Success:', event.id);
  // Rest of your logic...
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, chosenPlan } = session.metadata || {};
    console.log(`💰 CheckoutSession completed for user ${userId} with plan ${chosenPlan}`);
    await connectDB();
    const userDoc = await User.findById(userId);
    if (userDoc) {
      userDoc.subscriptionStatus = chosenPlan;
      await userDoc.save();
      console.log(`✅ Updated user ${userId} subscription to ${chosenPlan}`);
    }
  }

  return NextResponse.json({ message: 'Received' }, { status: 200 });
}