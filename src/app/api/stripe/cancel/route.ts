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
        // Fetch the Stripe customer ID
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (!customers.data.length) {
            return NextResponse.json({ error: 'Stripe customer not found' }, { status: 404 });
        }
        
        const customerId = customers.data[0].id;
        const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
        
        if (!subscriptions.data.length) {
            return NextResponse.json({ error: 'No active subscriptions found' }, { status: 404 });
        }
        
        const subscriptionId = subscriptions.data[0].id;
        await stripe.subscriptions.cancel(subscriptionId);

        user.subscriptionStatus = 'free';
        await user.save();

        return NextResponse.json({ message: 'Subscription canceled successfully' });
    } catch (error) {
        console.error('Subscription Cancellation Error:', error);
        return NextResponse.json({ error: 'Could not cancel subscription' }, { status: 500 });
    }
}
