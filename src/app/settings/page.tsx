// src/app/Settings.tsx
'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useSubscription } from '../lib/useSubscription';

export default function Settings() {
  const { subscription, updateSubscription } = useSubscription();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchUserDetails() {
      const res = await fetch('/api/user/details');
      const data = await res.json();
      if (data.error) {
        setMessage(data.error);
      } else {
        setEmail(data.email || '');
      }
      setLoading(false);
    }
    fetchUserDetails();
  }, []);

  const handleSubscriptionUpgrade = async () => {
    setMessage('');
    const res = await fetch('/api/stripe/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setMessage(data.error || 'Failed to initiate upgrade');
    }
  };

  const handleSubscriptionCancel = async () => {
    setMessage('');
    const confirmed = window.confirm('Are you sure you want to cancel your subscription? This will downgrade you to the free plan.');
    if (!confirmed) return;

    const res = await fetch('/api/stripe/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.message) {
      setMessage(data.message);
      updateSubscription('free'); // Update shared subscription state
    } else {
      setMessage(data.error || 'Failed to cancel subscription');
    }
  };

  const handleDeleteAccount = async () => {
    setMessage('');
    const confirmed = window.confirm('Are you sure you want to delete your account? This action is irreversible and will remove all your data.');
    if (!confirmed) return;

    const res = await fetch('/api/user/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();

    if (data.success) {
      setMessage('Account deleted. Signing out...');
      setTimeout(() => {
        signOut({ callbackUrl: '/auth/signup' });
      }, 2000);
    } else {
      setMessage(data.error || 'Failed to delete account');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Account Settings</h1>
        {loading || subscription === null ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-700"><strong>Email:</strong> {email}</p>
            <p className="text-gray-700"><strong>Plan:</strong> {subscription.toUpperCase()}</p>
            {(subscription === 'free' || subscription === 'basic') && (
              <button
                onClick={handleSubscriptionUpgrade}
                className="w-full bg-green-500 hover:bg-green-600 text-white p-3 rounded-lg font-semibold transition-colors"
              >
                Upgrade to Pro
              </button>
            )}
            {subscription !== 'free' && (
              <button
                onClick={handleSubscriptionCancel}
                className="w-full bg-red-500 hover:bg-red-600 text-white p-3 rounded-lg font-semibold transition-colors"
              >
                Cancel Subscription
              </button>
            )}
            <button
              onClick={handleDeleteAccount}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg font-semibold transition-colors"
            >
              Delete Account
            </button>
          </div>
        )}
        {message && <p className="mt-4 text-center text-red-500">{message}</p>}
      </div>
    </div>
  );
}