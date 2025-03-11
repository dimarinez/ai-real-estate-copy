// src/app/api/track/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/db';
import User from '../../../models/User';

export async function GET(req: NextRequest, { params }) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { id } = params;

    const user = await User.findOne({ email: session?.user?.email });
    if (!user || user.subscriptionStatus !== 'pro') {
      return NextResponse.redirect('https://airealestatecopy.com/contact-agent'); // Non-Pro fallback
    }

    const listing = user.savedListings.find(l => l.analytics?.trackableUrl?.includes(id));
    if (listing) {
      listing.analytics.views = (listing.analytics.views || 0) + 1;
      listing.analytics.lastUpdated = new Date();
      user.markModified('savedListings');
      await user.save();
      return NextResponse.redirect(listing.analytics.redirectUrl);
    }

    return NextResponse.redirect('https://airealestatecopy.com/contact-agent'); // Fallback
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.redirect('https://airealestatecopy.com/contact-agent');
  }
}