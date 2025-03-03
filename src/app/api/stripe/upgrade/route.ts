import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/db';
import User from '../../../models/User';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST() {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await User.findOne({ email: session?.user?.email });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    try {
        // Create Stripe Checkout session with user email
        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [{ price: process.env.STRIPE_PRICE_ID_PRO, quantity: 1 }],
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings?canceled=true`,
            customer_email: user.email, // ✅ Ensures email matches MongoDB
            metadata: { userId: user._id.toString() }, // ✅ Store user ID for later
        });

        return NextResponse.json({ url: stripeSession.url });
    } catch (error) {
        console.error('Stripe Upgrade Error:', error);
        return NextResponse.json({ error: 'Could not create upgrade session' }, { status: 500 });
    }
}
