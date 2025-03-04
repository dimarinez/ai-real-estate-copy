import { Stripe } from 'stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from "../../../lib/db";
import User from "../../../models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  console.log("Webhook hit at:", new Date().toISOString());
  const stripeSignature = (await headers()).get('stripe-signature');
  console.log("Stripe-Signature:", stripeSignature || "No signature");
  const body = await req.text();
  console.log("Raw body:", body.slice(0, 200));

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      stripeSignature as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
    console.log("Event constructed - ID:", event.id);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`❌ Signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }

  console.log('✅ Event type:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("Session ID:", session.id);
    console.log("Metadata:", JSON.stringify(session.metadata || {}, null, 2));

    const { userId, chosenPlan } = session.metadata || {};
    console.log("Extracted - userId:", userId, "chosenPlan:", chosenPlan);

    const validPlans = ["basic", "pro"] as const;
    type PlanType = typeof validPlans[number];
    const validatedPlan: PlanType = validPlans.includes(chosenPlan as PlanType)
      ? (chosenPlan as PlanType)
      : "basic";
    console.log("Validated plan:", validatedPlan);

    try {
      await connectDB();
      const userDoc = await User.findById(userId);
      if (userDoc) {
        userDoc.subscriptionStatus = validatedPlan;
        await userDoc.save();
        console.log(`✅ Updated user ${userId} to ${userDoc.subscriptionStatus}`);
      } else {
        console.log(`⚠️ User ${userId} not found`);
      }
    } catch (dbErr) {
      console.error("DB error:", dbErr instanceof Error ? dbErr.message : dbErr);
    }
  } else {
    console.log("Skipping unhandled event:", event.type);
  }

  console.log("Returning 200 response to Stripe");
  return NextResponse.json({ message: 'Received' }, { status: 200 });
}