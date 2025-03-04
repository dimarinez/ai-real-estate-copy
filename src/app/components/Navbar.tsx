'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Navbar() {
    const { data: session } = useSession();
    return (
        <nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
            <Link href="/" className="text-lg font-bold">
                AI Real Estate Copy
            </Link>

            <div className="flex gap-4">
                {session ? (
                    <>
                        <Link href="/dashboard" className="hover:underline">
                            Dashboard
                        </Link>
                        <Link href="/generate" className="hover:underline">
                            Generate Copy
                        </Link>
                        <Link href="/pricing" className="hover:underline">
                            Upgrade
                        </Link>
                        <Link href="/settings" className="hover:underline">
                            Settings
                        </Link>
                        <button
                            onClick={() => signOut({ callbackUrl: '/auth/signup' })}
                            className="bg-red-500 px-3 py-2 rounded hover:bg-red-600"
                        >
                            Sign Out
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/auth/signin" className="hover:underline">
                            Sign In
                        </Link>
                        <Link href="/auth/signup" className="hover:underline">
                            Sign Up
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}