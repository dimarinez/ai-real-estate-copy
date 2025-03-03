'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const result = await signIn("credentials", { email, password, callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard` });
        
        if (result?.error) {
            setError(result.error);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h2 className="text-2xl font-bold mb-4">Sign In</h2>

            {error && <p className="text-red-500">{error}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                    type="email"
                    placeholder="Email"
                    className="border p-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="border p-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit" className="bg-blue-500 text-white p-2">Sign In</button>
            </form>

            <button
                onClick={() => signIn('google', { callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard` })}
                className="bg-red-500 text-white p-2 mt-4"
            >
                Sign in with Google
            </button>
        </div>
    );
}
