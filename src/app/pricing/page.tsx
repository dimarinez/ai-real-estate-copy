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

  if (status === 'loading' || subscription === null) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (subscription === 'pro') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">You’re on the Pro Plan!</h1>
          <p className="text-gray-600">Enjoy unlimited generations and premium features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Choose Your Plan</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subscription === 'free' && (
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Basic</h2>
              <p className="text-3xl font-bold text-blue-600 mb-4">$10<span className="text-sm text-gray-500">/mo</span></p>
              <ul className="text-gray-600 mb-6 space-y-2">
                <li>10 Generations/Day</li>
                <li>Custom Tones & Languages</li>
              </ul>
              <button
                onClick={() => handleCheckout('basic')}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Subscribe'}
              </button>
            </div>
          )}
          {(subscription === 'free' || subscription === 'basic') && (
            <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Pro</h2>
              <p className="text-3xl font-bold text-green-600 mb-4">$30<span className="text-sm text-gray-500">/mo</span></p>
              <ul className="text-gray-600 mb-6 space-y-2">
                <li>Unlimited Generations</li>
                <li>Custom Tones & Languages</li>
                <li>Social Media Content</li>
              </ul>
              <button
                onClick={() => handleCheckout('pro')}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-semibold transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Subscribe'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}