// src/app/auth/verify-email/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function VerifyEmail() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing verification token');
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to verify email');
        } else {
          setMessage('Email verified successfully! Redirecting to sign in...');
          setTimeout(() => router.push('/auth/signin'), 2000);
        }
      } catch (err) {
        setError('An error occurred. Please try again.');
        console.error('Verify email error:', err);
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Verify Your Email</h2>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg">
            {message}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          <a href="/auth/signin" className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
            Go to Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
