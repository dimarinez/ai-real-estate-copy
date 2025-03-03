import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import User from '../../../models/User';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export async function POST(req: NextRequest) {
    await connectDB();

    const sig = req.headers.get("stripe-signature") as string;
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            await req.text(),
            sig,
            process.env.STRIPE_WEBHOOK_SECRET as string
        );
    } catch (error) {
        console.error('Webhook signature verification failed.', error);
        return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const email = session.customer_email;

        if (email) {
            const user = await User.findOne({ email });

            if (user) {
                user.subscriptionStatus = "pro";
                await user.save();
                console.log(`User ${email} upgraded to Pro.`);
            }
        }
    } else if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        const cust = (await stripe.customers.retrieve(customerId as string)) as Stripe.Customer;
        const email = cust.email;

        if (email) {
            const user = await User.findOne({ email });

            if (user) {
                user.subscriptionStatus = "pro";
                await user.save();
                console.log(`User ${email} subscription renewed.`);
            }
        }
    } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const cust = (await stripe.customers.retrieve(customerId as string)) as Stripe.Customer;
        const email = cust.email;

        if (email) {
            const user = await User.findOne({ email });

            if (user) {
                user.subscriptionStatus = "free";
                await user.save();
                console.log(`User ${email} downgraded to Free.`);
            }
        }
    }

    return NextResponse.json({ received: true });
}
