import { Stripe } from 'stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from "../../../lib/db";
import User from "../../../models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: Request) {
  const stripeSignature = (await headers()).get('stripe-signature');
  const body = await req.text();

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
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 }
    );
  }


  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    const { userId, chosenPlan } = session.metadata || {};

    const validPlans = ["basic", "pro"] as const;
    type PlanType = typeof validPlans[number];
    const validatedPlan: PlanType = validPlans.includes(chosenPlan as PlanType)
      ? (chosenPlan as PlanType)
      : "basic";

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