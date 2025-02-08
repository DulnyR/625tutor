"use client"; // Marking this as a Client Component

import { useRouter } from "next/navigation";
import './globals.css';

export default function HomePage() {
  const router = useRouter();

  const handleStart = () => {
    router.push("/selectSubjects"); 
  };

  return (
    <div className="flex flex-col items-center justify-center bg-primary" style={{ minHeight: 'calc(86vh)' }}>
      {/* Content */}
      <div className="flex flex-col items-center">
        <p className="text-lg text-black mb-4">Let’s Study!</p>
        <button 
          onClick={handleStart}
          className="px-6 py-3 bg-secondary text-white text-lg rounded-lg transition hover:ring-2 hover:ring-offset-2 hover:ring-secondary">
          Start Plan
        </button>
      </div>
    </div>
  );
}
