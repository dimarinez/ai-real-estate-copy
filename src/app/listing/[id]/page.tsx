// /app/listing/[id]/page.tsx
import { redirect } from 'next/navigation';
import connectDB from '../../lib/db';
import User from '@/app/models/User';

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

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }
) {
  await connectDB();

  const { id } = await params;

  // Find the listing by trackableId (stored in analytics.trackableUrl)
  const user = await User.findOne({
    'savedListings.analytics.trackableUrl': `/listing/${id}`,
  });

  if (!user) {
    // Redirect to a fallback or error page if no listing is found
    redirect('/404');
  }

  // Find the specific listing
  const listing = user.savedListings.find(
    (l: Listing) => l.analytics?.trackableUrl === `/listing/${id}`
  );

  if (!listing || !listing.analytics?.redirectUrl) {
    redirect('/404');
  }

  // Increment views
  await User.updateOne(
    { _id: user._id, 'savedListings.analytics.trackableUrl': `/listing/${id}` },
    { $inc: { 'savedListings.$.analytics.views': 1 } }
  );

  // Redirect to the custom URL
  redirect(listing.analytics.redirectUrl);
}