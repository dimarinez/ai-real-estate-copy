import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "../../../lib/db";
import User from "../../../models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  console.log("Stripe-Signature:", sig);
  let event;
  const body = await req.text();

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" + err }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;
    // userId + chosenPlan
    const userId = metadata?.userId;
    const chosenPlan = metadata?.chosenPlan; // "basic" or "pro"

    await connectDB();
    const userDoc = await User.findById(userId);
    if (userDoc) {
      // set userDoc.subscriptionStatus = chosenPlan
      userDoc.subscriptionStatus = chosenPlan; // e.g. "basic" or "pro"
      await userDoc.save();
      console.log(`✅ Updated user ${userId} subscription to ${chosenPlan}`);
    }
  }

  return NextResponse.json({ received: true });
}
