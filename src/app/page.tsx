// src/app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center flex-grow p-6 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to AI Real Estate Copy</h1>
      <p className="text-lg text-gray-700 mb-6 max-w-2xl">
        Generate professional real estate listings and social media content effortlessly with AI. Perfect for agents, marketers, and property owners.
      </p>
      <div className="flex gap-4">
        <Link
          href="/generate"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600"
        >
          Generate Copy Now
        </Link>
        <Link
          href="/pricing"
          className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600"
        >
          View Pricing
        </Link>
      </div>
    </div>
  );
}