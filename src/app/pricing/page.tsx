// src/app/Pricing.tsx (or wherever your component lives)
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<string | null>(null); // null while loading
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      async function fetchSubscription() {
        try {
          const res = await fetch('/api/user/subscription', {
            headers: { 'Content-Type': 'application/json' },
          });
          const data = await res.json();
          setSubscription(data.subscriptionStatus || 'free');
        } catch (error) {
          console.error('Failed to fetch subscription:', error);
          setSubscription('free'); // Default to free on error
        }
      }
      fetchSubscription();
    } else if (status === 'unauthenticated') {
      setSubscription('free'); // Treat unauthenticated as free
    }
  }, [session, status]);

  const handleCheckout = async (plan: 'basic' | 'pro') => {
    setLoading(true);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });

    const { url } = await res.json();
    setLoading(false);
    if (url) {
      window.location.href = url; // Redirect to Stripe checkout
    } else {
      console.error('No checkout URL returned');
    }
  };

  // Show loading state while subscription status is being fetched
  if (subscription === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // If user is on Pro, show a message instead of plans
  if (subscription === 'pro') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">You’re Already on the Pro Plan!</h1>
        <p className="text-gray-600">Enjoy all the premium features of your subscription.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Choose a Plan</h1>
      {loading && <p className="mb-4">Loading...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        {subscription === 'free' && (
          <div className="border p-6 text-center rounded shadow">
            <h2 className="text-xl font-bold">Basic Plan</h2>
            <p className="text-gray-600">$10 / month</p>
            <ul className="text-gray-500 mt-2">
              <li>10 generations/day</li>
              <li>Custom tones & languages</li>
              <li>Save listings in dashboard</li>
            </ul>
            <button
              onClick={() => handleCheckout('basic')}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 mt-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              Subscribe
            </button>
          </div>
        )}

        {(subscription === 'free' || subscription === 'basic') && (
          <div className="border p-6 text-center rounded shadow">
            <h2 className="text-xl font-bold">Pro Plan</h2>
            <p className="text-gray-600">$30 / month</p>
            <ul className="text-gray-500 mt-2">
              <li>Unlimited generations</li>
              <li>Custom tones & languages</li>
              <li>Social media content (Facebook, X, Instagram & LinkedIn)</li>
              <li>Advanced AI model</li>
            </ul>
            <button
              onClick={() => handleCheckout('pro')}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 mt-4 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              Subscribe
            </button>
          </div>
        )}
      </div>
    </div>
  );
}