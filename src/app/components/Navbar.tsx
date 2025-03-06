// src/components/Navbar.tsx
'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // For mobile menu toggle

  const fetchSubscription = async () => {
    if (status === 'authenticated' && session?.user) {
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
  };

  useEffect(() => {
    fetchSubscription();
  }, [session, status]);

  useEffect(() => {
    window.addEventListener('focus', fetchSubscription);
    return () => window.removeEventListener('focus', fetchSubscription);
  }, [session, status]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-md">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tight hover:text-amber-300 transition-colors">
          AI Real Estate Copy
        </Link>

        <button
          className="md:hidden text-white focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {session ? (
            <>
              <Link href="/dashboard" className="hover:text-amber-300 transition-colors">
                Dashboard
              </Link>
              <Link href="/generate" className="hover:text-amber-300 transition-colors">
                Generate
              </Link>
              {subscription !== 'pro' && subscription !== null && (
                <Link href="/pricing" className="hover:text-amber-300 transition-colors">
                  Upgrade
                </Link>
              )}
              <Link href="/settings" className="hover:text-amber-300 transition-colors">
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signup' })}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="hover:text-amber-300 transition-colors">
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu (visible when hamburger is clicked) */}
        <div
          className={`md:hidden absolute top-16 left-0 w-full bg-blue-700 text-white flex flex-col items-center gap-4 py-4 transition-all duration-300 ${
            isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        >
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="hover:text-amber-300 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/generate"
                className="hover:text-amber-300 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Generate
              </Link>
              {subscription !== 'pro' && subscription !== null && (
                <Link
                  href="/pricing"
                  className="hover:text-amber-300 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Upgrade
                </Link>
              )}
              <Link
                href="/settings"
                className="hover:text-amber-300 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  signOut({ callbackUrl: '/auth/signup' });
                  setIsMenuOpen(false);
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="hover:text-amber-300 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}