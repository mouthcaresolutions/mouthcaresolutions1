'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

export default function BlogDetailError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Article</h2>
      <p className="text-gray-500 mb-6">This article could not be loaded. It may have been moved or deleted.</p>
      <div className="flex justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Try Again
        </button>
        <Link href="/blog" className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          All Articles
        </Link>
      </div>
    </div>
  );
}