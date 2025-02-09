"use client";

import { useRouter } from 'next/navigation';

export default function EmailVerification() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center bg-primary" style={{ minHeight: 'calc(86vh)' }}>
      <div className="flex flex-col items-center">
        <p className="text-lg text-black mb-4">Please verify your email</p>
        <p className="text-black mb-4">A verification link has been sent to your email address. Please check your inbox and click on the link to verify your email.</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-secondary text-white text-lg rounded-lg transition hover:ring-2 hover:ring-offset-2 hover:ring-secondary"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}