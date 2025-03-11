// src/app/api/track/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/db';
import User from '../../../models/User';

// Define the shape of a Listing
interface Listing {
  title: string;
  description: string;
  location?: string;
  date: string;
  social?: {
    twitter: string;
    instagram: string;
    facebook: string;
    linkedin: string;
  };
  analytics?: {
    views: number;
    trackableUrl: string;
    redirectUrl: string;
    lastUpdated?: string | Date;
  };
}

// Define the User type (Mongoose document)
interface UserDoc {
  email: string;
  subscriptionStatus: string;
  savedListings: Listing[];
  markModified: (path: string) => void;
  save: () => Promise<void>;
}

// Use a simpler, Next.js-compatible signature
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.email) {
      return NextResponse.redirect('https://airealestatecopy.com/contact-agent');
    }

    const user = (await User.findOne({ email: session.user.email })) as UserDoc | null;
    if (!user || user.subscriptionStatus !== 'pro') {
      return NextResponse.redirect('https://airealestatecopy.com/contact-agent');
    }

    const listing = user.savedListings.find((l: Listing) => l.analytics?.trackableUrl?.includes(id));
    if (listing) {
      listing.analytics = listing.analytics || { views: 0, trackableUrl: id, redirectUrl: '' };
      listing.analytics.views = (listing.analytics.views || 0) + 1;
      listing.analytics.lastUpdated = new Date();
      user.markModified('savedListings');
      await user.save();
      return NextResponse.redirect(listing.analytics.redirectUrl);
    }

    return NextResponse.redirect('https://airealestatecopy.com/contact-agent');
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.redirect('https://airealestatecopy.com/contact-agent');
  }
}