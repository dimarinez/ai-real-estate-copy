'use client';

import { useState } from 'react';

export default function Pricing() {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async (plan: "basic" | "pro") => {
        setLoading(true);
        const res = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan }),
        });

        const { url } = await res.json();
        setLoading(false);
        window.location.href = url; // Redirect to Stripe checkout
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Choose a Plan</h1>
            {loading && 'Loading...'}

            <div className="grid grid-cols-2 gap-6">
                <div className="border p-6 text-center">
                    <h2 className="text-xl font-bold">Basic Plan</h2>
                    <p className="text-gray-600">$10 / month</p>
                    <button
                        onClick={() => handleCheckout("basic")}
                        disabled={loading}
                        className="bg-blue-500 text-white px-4 py-2 mt-4"
                    >
                        Subscribe
                    </button>
                </div>

                <div className="border p-6 text-center">
                    <h2 className="text-xl font-bold">Pro Plan</h2>
                    <p className="text-gray-600">$30 / month</p>
                    <button
                        onClick={() => handleCheckout("pro")}
                        disabled={loading}
                        className="bg-green-500 text-white px-4 py-2 mt-4"
                    >
                        Subscribe
                    </button>
                </div>
            </div>
        </div>
    );
}
