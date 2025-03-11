import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import User from '../../../models/User';

interface Listing {
    title: string;
    description: string;
    location?: string;
    date: Date;
    social?: {
      twitter?: string;
      instagram?: string;
      facebook?: string;
      linkedin?: string;
    };
    analytics?: {
      views: number;
      trackableUrl?: string;
      redirectUrl?: string;
      lastUpdated?: Date;
    };
  }
  

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) { 
  try {
    const { id } = await params;
    await connectDB();

    // find a user that has a listing with trackableUrl that ends in your {id}
    const urlToMatch = `https://airealestatecopy.com/api/track/${id}`;
    const user = await User.findOne({
      'savedListings.analytics.trackableUrl': urlToMatch
    });

    if (!user) {
      // no user has a listing with that trackableUrl
      return NextResponse.redirect('https://airealestatecopy.com/contact-agent');
    }

    // find the correct listing
    const listing = user.savedListings.find(
      (l: Listing) => l.analytics?.trackableUrl === urlToMatch
    );
    if (!listing) {
      return NextResponse.redirect('https://airealestatecopy.com/contact-agent');
    }

    // increment views
    if (!listing.analytics) {
      listing.analytics = {
        views: 0,
        trackableUrl: urlToMatch,
        redirectUrl: 'https://airealestatecopy.com/contact-agent',
      };
    }
    listing.analytics.views += 1;
    listing.analytics.lastUpdated = new Date();

    user.markModified('savedListings');
    await user.save();

    // Now send the visitor to the real URL
    return NextResponse.redirect(listing.analytics.redirectUrl);
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.redirect('https://airealestatecopy.com/contact-agent');
  }
}
