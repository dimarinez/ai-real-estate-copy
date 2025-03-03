import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/db';
import User from '../../../models/User';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function DELETE() {
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
        // Fetch the Stripe customer ID and delete their subscription if exists
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (customers.data.length) {
            const customerId = customers.data[0].id;
            const subscriptions = await stripe.subscriptions.list({ customer: customerId, limit: 1 });
            if (subscriptions.data.length) {
                await stripe.subscriptions.cancel(subscriptions.data[0].id);
            }
            await stripe.customers.del(customerId);
        }

        // Delete user from database
        await User.deleteOne({ email: user.email });

        return NextResponse.json({ success: true, message: 'User account deleted successfully' });
    } catch (error) {
        console.error('User Deletion Error:', error);
        return NextResponse.json({ error: 'Could not delete user account' }, { status: 500 });
    }
}
