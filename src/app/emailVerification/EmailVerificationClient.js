"use client";

import { useRouter } from 'next/navigation';

export default function EmailVerificationClient() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 to-purple-500 flex flex-col items-center justify-center p-8">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-xl p-8 space-y-6">
        <h1 className="text-4xl font-bold text-center text-black mb-4">Email Verification</h1>
        <p className="text-lg text-black leading-relaxed mb-6">
          A verification link has been sent to your email address. Please check your inbox and click on the link to verify your email.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-500 text-white text-lg rounded-lg transition hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}