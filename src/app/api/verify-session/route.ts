import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-02-24.acacia',
});

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return NextResponse.json({
      success: true,
      payment_status: session.payment_status,
      metadata: session.metadata,
    });
  } catch (error) {
    console.error('Error retrieving session:', error);
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
  }
}