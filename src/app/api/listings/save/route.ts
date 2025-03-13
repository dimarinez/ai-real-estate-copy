// src/app/api/listings/save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import connectDB from '../../../lib/db';
import User from '../../../models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { title, description, social, redirectUrl, location } = await req.json();
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const maxSaved = user.subscriptionStatus === 'pro' ? 500 : user.subscriptionStatus === 'basic' ? 25 : 5;
    if (user.savedListings.length >= maxSaved) {
      return NextResponse.json({ error: `Max ${maxSaved} listings reached` }, { status: 403 });
    }

    // Pro-only: Add trackable URL and analytics
    let trackableUrl = null;
    if (user.subscriptionStatus === 'pro') {
      const uniqueId = Date.now().toString(); // Or use UUID for uniqueness
      trackableUrl = `/listing/${uniqueId}`;
    }

    const newListing = {
        title,
        description,
        location, // Add this
        date: new Date(),
        social: social ? {
          twitter: social.twitter ? (trackableUrl ? `${social.twitter} ${trackableUrl}` : social.twitter) : undefined,
          instagram: social.instagram ? (trackableUrl ? `${social.instagram} ${trackableUrl}` : social.instagram) : undefined,
          facebook: social.facebook ? (trackableUrl ? `${social.facebook} ${trackableUrl}` : social.facebook) : undefined,
          linkedin: social.linkedin ? (trackableUrl ? `${social.linkedin} ${trackableUrl}` : social.linkedin) : undefined,
        } : undefined,
        analytics: trackableUrl ? {
          views: 0,
          trackableUrl,
          redirectUrl: redirectUrl || 'https://airealestatecopy.com/contact-agent',
        } : undefined,
    };

    user.savedListings.push(newListing);
    user.markModified('savedListings');
    await user.save();

    await User.findOne({ email: session.user.email });

    return NextResponse.json({ message: 'Listing saved' });
  } catch (error) {
    console.error('Error saving listing:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}