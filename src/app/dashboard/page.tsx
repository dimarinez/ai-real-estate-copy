// src/app/dashboard/page.tsx
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
  const [visibleListings, setVisibleListings] = useState(6); // Initial limit of 6 listings
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState('free');
  const [expandedListing, setExpandedListing] = useState<number | null>(null); // For expanding listing content

  useEffect(() => {
    async function fetchListings() {
      const res = await fetch('/api/listings/get');
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
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

  const toggleExpand = (index: number) => {
    setExpandedListing(expandedListing === index ? null : index);
  };

  const loadMore = () => {
    setVisibleListings((prev) => prev + 6); // Load 6 more listings
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Your Dashboard</h1>
          <p className="text-lg text-gray-600">
            Subscription:{' '}
            <span
              className={`font-semibold ${
                subscription === 'pro'
                  ? 'text-green-600'
                  : subscription === 'basic'
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              {subscription.toUpperCase()}
            </span>
          </p>
        </header>

        {loading && (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}

        {!loading && listings.length === 0 && !error && (
          <div className="text-center text-gray-500">
            <p className="text-lg">No saved listings yet. Start generating some!</p>
            <a href="/generate" className="mt-2 inline-block text-blue-600 hover:text-blue-800 font-semibold">
              Go to Generate
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.slice(0, visibleListings).map((listing, index) => (
            <div
              key={index}
              className={`bg-white p-6 rounded-lg shadow-md transition-all duration-300 border border-gray-200 ${
                expandedListing === index ? 'shadow-xl' : 'hover:shadow-lg cursor-pointer'
              }`}
              onClick={() => toggleExpand(index)}
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{listing.title}</h2>
              <p
                className={`text-gray-600 mb-4 ${
                  expandedListing === index ? '' : 'line-clamp-3'
                }`}
              >
                {listing.description}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Saved on {new Date(listing.date).toLocaleDateString()}
              </p>
              {expandedListing === index && listing.social && subscription !== 'free' && (
                <div className="mt-4 text-sm text-gray-700 space-y-2">
                  <p><strong>Twitter:</strong> {listing.social.twitter}</p>
                  <p><strong>Instagram:</strong> {listing.social.instagram}</p>
                  <p><strong>Facebook:</strong> {listing.social.facebook}</p>
                  <p><strong>LinkedIn:</strong> {listing.social.linkedin}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {visibleListings < listings.length && !loading && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}