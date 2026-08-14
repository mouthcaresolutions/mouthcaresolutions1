'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Something Went Wrong</h2>
        <p className="text-gray-500 mb-8">
          We encountered an unexpected error. Please try again or return to the homepage.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
