'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function ContactError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Contact Page</h2>
      <p className="text-gray-500 mb-6">Something went wrong. Please try again.</p>
      <div className="flex justify-center gap-3">
        <button onClick={() => reset()} className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors">
          Try Again
        </button>
        <Link href="/" className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          Home
        </Link>
      </div>
    </div>
  );
}