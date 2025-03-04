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
  console.log("Raw body:", body.slice(0, 200)); // Limit for readability

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

  console.log('✅ Success: Event ID:', event.id);
  console.log('Event type:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Log full session object (trimmed for brevity)
    console.log("Full session object:", JSON.stringify({
      id: session.id,
      payment_status: session.payment_status,
      metadata: session.metadata
    }, null, 2));

    const { userId, chosenPlan } = session.metadata || {};
    console.log("Extracted metadata - userId:", userId, "chosenPlan:", chosenPlan);

    // Strict validation
    const validPlans = ["basic", "pro"] as const;
    type PlanType = typeof validPlans[number];
    const validatedPlan: PlanType = validPlans.includes(chosenPlan as PlanType)
      ? (chosenPlan as PlanType)
      : "basic"; // Fallback to "basic" if invalid
    console.log("Validated plan:", validatedPlan);

    await connectDB();
    const userDoc = await User.findById(userId);
    if (userDoc) {
      console.log("Before update - subscriptionStatus:", userDoc.subscriptionStatus);
      userDoc.subscriptionStatus = validatedPlan;
      await userDoc.save();
      console.log(`✅ After update - user ${userId} subscriptionStatus: ${userDoc.subscriptionStatus}`);
    } else {
      console.log(`❌ User ${userId} not found`);
    }
  }

  return NextResponse.json({ message: 'Received' }, { status: 200 });
}