"use client";

import { useSearchParams } from "next/navigation";

export default function AuthErrorPageClient() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold text-red-500">Authentication Error</h1>
      <p className="mt-2 text-gray-700">
        {errorParam ? `Error: ${errorParam}` : "An unknown error occurred."}
      </p>
      <a href="/auth/signin" className="mt-4 text-blue-500 underline">
        Go back to Sign In
      </a>
    </div>
  );
}
