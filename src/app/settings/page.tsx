// src/app/Settings.tsx (or wherever your component lives)
'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';

export default function Settings() {
  const [subscription, setSubscription] = useState('free');
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
        setSubscription(data.subscriptionStatus || 'free');
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
      window.location.href = data.url; // Redirect to Stripe checkout
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
      setSubscription('free');
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="border p-6 rounded-lg shadow-md max-w-md w-full">
          <p className="mb-2"><strong>Email:</strong> {email}</p>
          <p className="mb-4"><strong>Subscription:</strong> {subscription.toUpperCase()}</p>

          {(subscription === 'free' || subscription === 'basic') && (
            <button
              onClick={handleSubscriptionUpgrade}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-4 w-full"
            >
              Upgrade to Pro
            </button>
          )}

          {subscription !== 'free' && (
            <button
              onClick={handleSubscriptionCancel}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mb-4 w-full"
            >
              Cancel Subscription
            </button>
          )}

          <button
            onClick={handleDeleteAccount}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full"
          >
            Delete Account
          </button>
        </div>
      )}

      {message && <p className="mt-4 text-red-500">{message}</p>}
    </div>
  );
}