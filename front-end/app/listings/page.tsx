import Link from "next/link";
import { SlidersHorizontal, Building2, ChevronLeft, ChevronRight, X } from "lucide-react";
import { ListingCard } from "@/components/listings/ListingCard";
import { getListings } from "@/lib/data";
import type { ListingFilters } from "@/types/listing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ListingsPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;

  const search = typeof rawParams.search === "string" ? rawParams.search : undefined;
  const listingType = typeof rawParams.listingType === "string" ? rawParams.listingType : undefined;
  const roomType = typeof rawParams.roomType === "string" ? rawParams.roomType : undefined;
  const preferredTenant = typeof rawParams.preferredTenant === "string" ? rawParams.preferredTenant : undefined;
  const sort = typeof rawParams.sort === "string" ? rawParams.sort : "newest";
  const page = typeof rawParams.page === "string" ? parseInt(rawParams.page, 10) || 1 : 1;

  const filters: ListingFilters = {
    search,
    listingType,
    roomType,
    preferredTenant,
    sort,
    page,
    limit: 12,
  };

  const { listings, total, totalPages } = await getListings(filters);

  // Helper to build filter query string
  const createQueryUrl = (updates: Record<string, string | undefined>) => {
    const current = new URLSearchParams();
    if (search) current.set("search", search);
    if (listingType) current.set("listingType", listingType);
    if (roomType) current.set("roomType", roomType);
    if (preferredTenant) current.set("preferredTenant", preferredTenant);
    if (sort && sort !== "newest") current.set("sort", sort);
    if (page > 1) current.set("page", String(page));

    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === "all") {
        current.delete(key);
      } else {
        current.set(key, val);
      }
    });

    const str = current.toString();
    return `/listings${str ? `?${str}` : ""}`;
  };

  const roomTypes = ["Single", "Double", "Shared"];
  const tenantTypes = ["Boys", "Girls", "Any"];

  const hasActiveFilters = Boolean(
    search || listingType || roomType || preferredTenant || (sort && sort !== "newest")
  );

  return (
    <div className="mx-auto max-w-[1460px] px-4 pt-4 pb-16 sm:px-6">
      {/* Hero Banner */}
      <section className="relative flex min-h-[380px] items-end overflow-hidden rounded-[28px] bg-[linear-gradient(90deg,rgba(7,29,38,.85),rgba(7,29,38,.65)_45%,rgba(7,29,38,.3)),url('/images/home.png')] bg-cover bg-center p-6 shadow-[0_24px_60px_rgba(15,118,110,.14)] sm:p-8">
        <div className="relative max-w-2xl text-white">
          <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-xs">
            Verified Student & Working Professional Stays
          </span>
          <h1 className="mt-3 max-w-[650px] text-3xl leading-[1.15] font-extrabold tracking-tight sm:text-5xl">
            Find a room or hostel that feels right for you
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
            Browse verified PGs and hostels with transparent rent per room or bed, meal facilities, real photos, and pinpoint map locations.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="#listings-feed"
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-teal-800 shadow-md transition hover:bg-slate-100"
            >
              Explore Accommodations
            </a>
            <Link
              href="/listings/new"
              className="rounded-xl border border-white/45 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur-xs transition hover:bg-white/20"
            >
              + Add New Listing (PG / Hostel)
            </Link>
          </div>
        </div>
      </section>

      {/* Main Filter Section */}
      <section id="listings-feed" className="mt-10">
        <div className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-sm sm:px-6 sm:py-4">
          {/* Filter Pills and Sort Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* 4.1 Listing Type Filter (All, PG, Hostel) */}
              <div className="mr-1 flex items-center gap-1.5 border-r border-slate-200 pr-3">
                <span className="text-xs font-extrabold tracking-wider text-slate-800 uppercase">
                  Type:
                </span>
                <Link
                  href={createQueryUrl({ listingType: undefined, page: "1" })}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    !listingType
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All
                </Link>
                <Link
                  href={createQueryUrl({ listingType: "PG", page: "1" })}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    listingType === "PG"
                      ? "bg-teal-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  PG
                </Link>
                <Link
                  href={createQueryUrl({ listingType: "Hostel", page: "1" })}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                    listingType === "Hostel"
                      ? "bg-teal-700 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Hostel
                </Link>
              </div>

              <span className="flex items-center gap-1 text-xs font-bold tracking-wider text-slate-500 uppercase">
                <SlidersHorizontal size={13} /> Room:
              </span>
              <Link
                href={createQueryUrl({ roomType: undefined, page: "1" })}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  !roomType
                    ? "bg-teal-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </Link>
              {roomTypes.map((type) => (
                <Link
                  key={type}
                  href={createQueryUrl({ roomType: type, page: "1" })}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    roomType === type
                      ? "bg-teal-700 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {type}
                </Link>
              ))}

              <span className="ml-2 flex items-center gap-1 text-xs font-bold tracking-wider text-slate-500 uppercase">
                Tenant:
              </span>
              <Link
                href={createQueryUrl({ preferredTenant: undefined, page: "1" })}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  !preferredTenant
                    ? "bg-teal-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </Link>
              {tenantTypes.map((tenant) => (
                <Link
                  key={tenant}
                  href={createQueryUrl({ preferredTenant: tenant, page: "1" })}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    preferredTenant === tenant
                      ? "bg-teal-700 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tenant}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Link
                  href="/listings"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
                >
                  Reset All
                </Link>
              )}

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Sort:</span>
                <Link
                  href={createQueryUrl({ sort: sort === "price_asc" ? "price_desc" : sort === "price_desc" ? "newest" : "price_asc" })}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-700 hover:bg-slate-200"
                >
                  {sort === "price_asc" ? "Price: Low to High" : sort === "price_desc" ? "Price: High to Low" : "Newest First"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="mt-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              {search
                ? `Search results for "${search}"`
                : listingType === "Hostel"
                ? "Verified Student & Commercial Hostels"
                : listingType === "PG"
                ? "Available PG Accommodations"
                : "Available Student Rooms & Hostels"}
            </h2>
            <p className="text-xs font-medium text-slate-500">
              Verified accommodations for students and working professionals
            </p>
          </div>
        </div>

        {/* Listings Grid or Empty State */}
        {listings.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id || listing._id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-8 flex flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Building2 size={32} />
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">No rooms found</h3>
            <p className="mt-2 max-w-md text-sm text-slate-600">
              {search
                ? `We couldn't find any listings matching "${search}". Try searching another area or city.`
                : "No listings match your selected filters. Try broadening your criteria."}
            </p>
            <div className="mt-5 flex gap-3">
              <Link
                href="/listings"
                className="rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800"
              >
                Clear all filters
              </Link>
              <Link
                href="/listings/new"
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Post a new room
              </Link>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              href={createQueryUrl({ page: String(Math.max(1, page - 1)) })}
              aria-disabled={page <= 1}
              className={`flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-xs transition ${
                page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-50"
              }`}
            >
              <ChevronLeft size={16} />
              Previous
            </Link>

            <span className="text-xs font-bold text-slate-600">
              Page {page} of {totalPages}
            </span>

            <Link
              href={createQueryUrl({ page: String(Math.min(totalPages, page + 1)) })}
              aria-disabled={page >= totalPages}
              className={`flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-xs transition ${
                page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-50"
              }`}
            >
              Next
              <ChevronRight size={16} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
