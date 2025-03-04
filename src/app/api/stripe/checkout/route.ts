import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from '../../../lib/auth';
import connectDB from "../../../lib/db";
import User from "../../../models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const plan = body.plan as "basic" | "pro";

  // 1. Determine the correct price ID from environment variables or config
  const priceId =
    plan === "basic"
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO;

  // 2. Retrieve your user from DB if you want to store userId in metadata
  const user = await User.findOne({ email: session?.user?.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // 3. Create Stripe Checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
    customer_email: user.email,
    metadata: {
      userId: user._id.toString(),
      chosenPlan: plan, // "basic" or "pro"
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
