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
                setSubscription(data.subscriptionStatus);
                setEmail(data.email);
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
            setMessage(data.error);
        }
    };

    const handleSubscriptionCancel = async () => {
        setMessage('');
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
            setMessage(data.error);
        }
    };

    const handleDeleteAccount = async () => {
        setMessage('');
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
            setMessage(data.error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Account Settings</h1>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div className="border p-6 rounded-lg shadow-md max-w-md w-full">
                    <p><strong>Email:</strong> {email}</p>
                    <p><strong>Subscription:</strong> {subscription.toUpperCase()}</p>

                    {subscription === 'free' ? (
                        <button
                            onClick={handleSubscriptionUpgrade}
                            className="bg-green-500 text-white px-4 py-2 mt-4"
                        >
                            Upgrade to Pro
                        </button>
                    ) : (
                        <button
                            onClick={handleSubscriptionCancel}
                            className="bg-red-500 text-white px-4 py-2 mt-4"
                        >
                            Cancel Subscription
                        </button>
                    )}
                    
                    <button
                        onClick={handleDeleteAccount}
                        className="bg-gray-500 text-white px-4 py-2 mt-4"
                    >
                        Delete Account
                    </button>
                </div>
            )}

            {message && <p className="mt-4 text-red-500">{message}</p>}
        </div>
    );
}

