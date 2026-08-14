import PublicLayout from "@/components/mcs/PublicLayout";
import Link from "next/link";
import { Home, Search, ArrowLeft, Stethoscope } from "lucide-react";

export default function NotFound() {
  return (
    <PublicLayout activeNav="">
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full text-center">
          {/* Tooth icon illustration */}
          <div className="mx-auto w-28 h-28 rounded-full bg-teal-50 flex items-center justify-center mb-8">
            <Stethoscope className="w-14 h-14 text-teal-600" />
          </div>

          <h1 className="text-7xl sm:text-8xl font-extrabold text-teal-600 mb-4">404</h1>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-500 text-lg mb-10 leading-relaxed">
            This page has gone missing — like a tooth that&apos;s been extracted!
            But don&apos;t worry, we can help you find your way back to a healthy smile.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-8 py-3.5 rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 border-2 border-teal-600 text-teal-700 px-8 py-3.5 rounded-lg font-medium hover:bg-teal-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              View Services
            </Link>
          </div>

          <div className="bg-teal-50 border border-teal-100 rounded-xl p-6">
            <div className="flex items-center justify-center gap-2 text-teal-700 font-medium mb-2">
              <Search className="w-4 h-4" />
              Looking for something specific?
            </div>
            <p className="text-sm text-teal-600">
              Try browsing our{" "}
              <Link href="/blog" className="underline font-medium hover:text-teal-800">
                dental health blog
              </Link>{" "}
              or{" "}
              <Link href="/services" className="underline font-medium hover:text-teal-800">
                services page
              </Link>{" "}
              to find what you need.
            </p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
