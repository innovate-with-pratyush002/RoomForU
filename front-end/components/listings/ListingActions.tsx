"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Edit3, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface ListingActionsProps {
  listingId: string;
  isOwner?: boolean;
}

export function ListingActions({ listingId, isOwner = false }: ListingActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOwner) {
    return null;
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await api.listings.delete(listingId);
      router.push("/listings");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to delete listing. You may not be authorized.");
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="rounded-xl bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/listings/${listingId}/edit`}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
        >
          <Edit3 size={16} />
          Edit Listing
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
        >
          <Trash2 size={16} />
          {deleting ? "Deleting..." : "Delete Listing"}
        </button>
      </div>
    </div>
  );
}
