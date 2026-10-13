"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 shadow-sm">
        <AlertTriangle size={32} />
      </div>

      <h1 className="mt-5 text-2xl font-extrabold text-slate-900 sm:text-3xl">
        Something went wrong
      </h1>

      <p className="mt-2 text-sm text-slate-600">
        {error.message || "An unexpected error occurred while loading this page."}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
        >
          <RefreshCw size={15} />
          Try again
        </button>

        <Link
          href="/listings"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <Home size={15} />
          Go to Listings
        </Link>
      </div>
    </div>
  );
}
