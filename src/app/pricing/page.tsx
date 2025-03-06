// src/app/Pricing.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<string | null>(null);
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
          setSubscription('free');
        }
      }
      fetchSubscription();
    } else if (status === 'unauthenticated') {
      setSubscription('free'); // Show free tier for unauthenticated users
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
      window.location.href = url;
    } else {
      console.error('No checkout URL returned');
    }
  };

  if (status === 'loading' || subscription === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (subscription === 'pro' && status === 'authenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">You’re a Pro User!</h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Enjoy unlimited access to our enhanced AI model, optimized social posts, and premium features designed for maximum engagement.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 text-center">Unlock High-Quality Listings</h1>
        <p className="text-lg text-gray-600 mb-10 text-center max-w-2xl mx-auto">
          Choose a plan to create professional, engagement-driven real estate copy that stands out and converts.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {subscription === 'free' && (
            <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Basic</h2>
              <p className="text-4xl font-bold text-blue-600 mb-4">
                $10<span className="text-base text-gray-500">/mo</span>
              </p>
              <p className="text-gray-600 mb-6">
                Get started with high-quality listings tailored for engagement.
              </p>
              <ul className="text-gray-700 mb-8 space-y-3">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
                  </svg>
                  <span>10 Generations/Day</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
                  </svg>
                  <span>Choose Language & Tone</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
                  </svg>
                  <span>Save up to 10 Listings</span>
                </li>
              </ul>
              {status === 'authenticated' ? (
                <button
                  onClick={() => handleCheckout('basic')}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:bg-gray-400 disabled:shadow-none"
                >
                  {loading ? 'Processing...' : 'Subscribe to Basic'}
                </button>
              ) : (
                <Link
                  href="/auth/signin"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 text-center block"
                >
                  Sign In to Subscribe
                </Link>
              )}
            </div>
          )}
          {(subscription === 'free' || subscription === 'basic') && (
            <div className="p-6 bg-white rounded-xl shadow-lg border border-green-200 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Pro</h2>
              <p className="text-4xl font-bold text-green-600 mb-4">
                $30<span className="text-base text-gray-500">/mo</span>
              </p>
              <p className="text-gray-600 mb-6">
                Maximize engagement with our enhanced AI and unlimited features.
              </p>
              <ul className="text-gray-700 mb-8 space-y-3">
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
                  </svg>
                  <span>Unlimited Generations</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
                  </svg>
                  <span>Enhanced AI Model</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
                  </svg>
                  <span>Optimized Social Media Posts</span>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
                  </svg>
                  <span>Unlimited Saves</span>
                </li>
              </ul>
              {status === 'authenticated' ? (
                <button
                  onClick={() => handleCheckout('pro')}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-700 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:bg-gray-400 disabled:shadow-none"
                >
                  {loading ? 'Processing...' : 'Subscribe to Pro'}
                </button>
              ) : (
                <Link
                  href="/auth/signin"
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 text-center block"
                >
                  Sign In to Subscribe
                </Link>
              )}
            </div>
          )}
        </div>
        {status === 'unauthenticated' && (
          <p className="mt-6 text-center text-gray-600">
            New here?{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:text-blue-800 font-semibold">
              Sign up
            </Link>{' '}
            to get started!
          </p>
        )}
      </div>
    </div>
  );
}