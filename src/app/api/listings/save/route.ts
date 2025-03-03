import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/db';
import User from '../../../models/User';

export async function POST(req: NextRequest) {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { title, description } = await req.json();

    if (!title || !description) {
        return NextResponse.json({ error: 'Missing title or description' }, { status: 400 });
    }

    const user = await User.findOne({ email: session?.user?.email });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ✅ Limit saved listings based on subscription
    if (user.subscriptionStatus === 'free' && user.savedListings.length >= 0) {
        return NextResponse.json({ error: 'Upgrade to save listings' }, { status: 403 });
    } else if (user.subscriptionStatus === 'basic' && user.savedListings.length >= 10) {
        return NextResponse.json({ error: 'Upgrade to Pro to save more listings' }, { status: 403 });
    }

    user.savedListings.push({ title, description, date: new Date() });
    await user.save();

    return NextResponse.json({ message: 'Listing saved successfully' });
}
