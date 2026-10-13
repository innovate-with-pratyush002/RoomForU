import Link from "next/link";
import { MapPin, Edit3, Trash2 } from "lucide-react";
import type { Listing } from "@/types/listing";

interface ListingCardProps {
  listing: Listing;
  profile?: boolean;
  onDelete?: (id: string) => void;
}

export function ListingCard({ listing, profile = false, onDelete }: ListingCardProps) {
  const listingId = listing.id || listing._id || "";
  const imageUrl =
    listing.imageUrl ||
    listing.image ||
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-slate-300/30 bg-white shadow-[0_18px_40px_rgba(15,23,42,.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_48px_rgba(15,23,42,.14)]">
      <Link href={`/listings/${listingId}`} className="relative block overflow-hidden">
        <div className={`relative w-full overflow-hidden ${profile ? "h-52" : "h-48"}`}>
          <img
            src={imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 to-transparent" />
          
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-teal-700 shadow-sm">
              {listing.availabilityStatus || "Available"}
            </span>
            {listing.roomType && (
              <span className="rounded-full bg-teal-800/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-xs">
                {listing.roomType}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4.5">
        <Link href={`/listings/${listingId}`}>
          <h2 className="line-clamp-1 text-base font-bold text-slate-900 transition group-hover:text-teal-700">
            {listing.title}
          </h2>
        </Link>

        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <MapPin size={15} className="shrink-0 text-orange-500" />
          <span className="truncate">{listing.location}, {listing.state}</span>
        </p>

        {listing.preferredTenant && (
          <p className="mt-2 text-xs text-slate-600">
            Preferred: <span className="font-semibold text-slate-800">{listing.preferredTenant}</span>
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="text-lg font-black text-emerald-600">
              ₹ {Number(listing.price || 0).toLocaleString("en-IN")}
              <span className="ml-1 text-xs font-semibold text-slate-500">/mo</span>
            </p>
          </div>

          {!profile ? (
            <Link
              href={`/listings/${listingId}`}
              className="rounded-xl bg-teal-50 px-3.5 py-1.5 text-xs font-bold text-teal-700 transition hover:bg-teal-100"
            >
              Details
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={`/listings/${listingId}/edit`}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                title="Edit Listing"
              >
                <Edit3 size={13} />
                Edit
              </Link>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(listingId)}
                  className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
                  title="Delete Listing"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
