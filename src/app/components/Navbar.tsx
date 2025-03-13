// src/components/Navbar.tsx
'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation'; // For route checking
import { useSubscription } from '../lib/useSubscription';

export default function Navbar() {
  const { data: session, status } = useSession();
  const { subscription } = useSubscription();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50); // Trigger gradient after 50px scroll
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Determine navbar background: transparent on homepage unless scrolled
  const isHomePage = pathname === '/';
  const navBackground = isHomePage && !isScrolled && !isMenuOpen
    ? 'bg-transparent' 
    : 'bg-gradient-to-r from-blue-600 to-blue-800 shadow-md';

  if (!isMounted) {
    return (
      <nav className={`z-2 top-0 left-0 z-2 w-full text-white p-4 ${navBackground} ${isHomePage && 'fixed'}`}>
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold tracking-tight hover:text-amber-300 transition-colors">
            AI Real Estate Copy
          </Link>
          <button
            className="md:hidden text-white focus:outline-none"
            aria-label="Toggle menu"
            disabled
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/auth/signin" className="hover:text-amber-300 transition-colors">
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`top-0 z-2 left-0 w-full text-white p-4 duration-300 ${navBackground} ${isHomePage && 'fixed'}`}>
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tight hover:text-amber-300 transition-colors">
          AI Real Estate Copy
        </Link>

        <button
          className="md:hidden text-white focus:outline-none"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {status === 'loading' || subscription === null ? null : session ? (
            <>
              <Link href="/dashboard" className="hover:text-amber-300 transition-colors">
                Dashboard
              </Link>
              <Link href="/generate" className="hover:text-amber-300 transition-colors">
                Generate
              </Link>
              {subscription !== 'pro' && (
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white flex flex-col items-center gap-4 py-4 transition-all duration-300 z-10">
            {status === 'loading' || subscription === null ? null : session ? (
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
                {subscription !== 'pro' && (
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
        )}
      </div>
    </nav>
  );
}