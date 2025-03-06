'use client';

import { useState, useEffect } from 'react';

interface Social {
  twitter: string;
  instagram: string;
  facebook: string;
  linkedin: string;
}

interface Listing {
  title: string;
  description: string;
  date: string;
  social?: Social;
}

export default function Dashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState('free');

  useEffect(() => {
    async function fetchListings() {
      const res = await fetch('/api/listings/get');
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        // data.savedListings should match your Listing[] shape
        setListings(data.savedListings);
      }
      setLoading(false);
    }

    async function fetchSubscription() {
      const res = await fetch('/api/user/subscription');
      const data = await res.json();
      setSubscription(data.subscriptionStatus || 'free');
    }

    fetchListings();
    fetchSubscription();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p>Subscription status: {subscription}</p>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {listings.map((listing, index) => (
          <div key={index} className="border p-4 rounded shadow">
            <h2 className="text-lg font-bold">{listing.title}</h2>
            <p>{listing.description}</p>
            <p className="text-gray-500 text-sm">
              Saved on {new Date(listing.date).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
