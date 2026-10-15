import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getListing } from "@/lib/data";
import { api } from "@/lib/api";
import { ListingActions } from "@/components/listings/ListingActions";
import { DetailInteractiveSections } from "@/components/listings/DetailInteractiveSections";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Enforce authentication exactly like EJS router.get("/:id", isLoggedIn, ...)
  const auth = await api.auth.getCurrentUser();
  if (!auth.authenticated || !auth.user) {
    redirect(`/signin?returnTo=${encodeURIComponent(`/listings/${id}`)}`);
  }

  let listing;
  try {
    listing = await getListing(id);
  } catch (err: any) {
    if (err?.status === 401) {
      redirect(`/signin?returnTo=${encodeURIComponent(`/listings/${id}`)}`);
    }
    listing = null;
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">Listing Not Found</h1>
        <p className="mt-3 text-sm text-slate-600">
          The requested room accommodation could not be found or has been deleted.
        </p>
        <Link
          href="/listings"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-800"
        >
          <ArrowLeft size={16} /> Back to all listings
        </Link>
      </div>
    );
  }

  const imageUrl =
    listing.imageUrl ||
    listing.image ||
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80";

  const coordinates = listing.coordinates || { lat: 28.6139, lon: 77.209 };
  const listingId = listing.id || listing._id || id;

  const currentUserId = auth.user?.id || auth.user?._id;
  const listingOwnerId =
    listing.userId ||
    (typeof listing.user === "object" ? (listing.user?.id || listing.user?._id) : listing.user);
  const isOwner = Boolean(
    currentUserId && listingOwnerId && String(currentUserId) === String(listingOwnerId)
  );

  const isHostel = listing.listingType === "Hostel";

  const infoItems = isHostel
    ? [
        { label: "Hostel For", value: listing.hostelFor || "All" },
        { label: "Room Sharing", value: listing.roomSharingType || "Single Sharing" },
        {
          label: "Available Beds",
          value:
            listing.availableBeds !== undefined
              ? `${listing.availableBeds} beds vacant`
              : "Available",
        },
        { label: "Food / Mess", value: listing.foodFacility || "Not Available" },
        { label: "Location", value: `${listing.location}, ${listing.state}` },
        { label: "Contact Phone", value: listing.phone || "N/A" },
        { label: "Reviews", value: `${listing.reviews?.length || 0} ratings shared` },
      ]
    : [
        { label: "Location", value: listing.location },
        { label: "State", value: listing.state },
        { label: "Room Type", value: listing.roomType || "Single" },
        { label: "Preferred Tenant", value: listing.preferredTenant || "Any" },
        { label: "Contact", value: listing.phone || "N/A" },
        { label: "Reviews", value: `${listing.reviews?.length || 0} ratings shared` },
      ];

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-4 pb-16">
      {/* Top Section */}
      <section className="grid gap-4 xl:grid-cols-2">
        {/* Left: Image Box */}
        <div className="relative min-h-[380px] overflow-hidden rounded-[28px] border border-slate-300/20 bg-white shadow-[0_20px_45px_rgba(15,23,42,.08)] xl:min-h-[430px]">
          <img
            src={imageUrl}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-bold text-teal-700 shadow-sm">
              {isHostel ? "Hostel" : "PG"}
            </span>
            <span className="rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-bold text-[#0f766e] shadow-lg">
              {isHostel && listing.availableBeds !== undefined
                ? `${listing.availableBeds} beds vacant`
                : listing.availabilityStatus || "Available"}
            </span>
          </div>
        </div>

        {/* Right: Info Section */}
        <div className="flex flex-col justify-between rounded-[28px] border border-slate-300/20 bg-white/95 p-5 shadow-[0_20px_45px_rgba(15,23,42,.08)]">
          <div>
            <p className="text-[13px] font-bold tracking-wider text-[#0f766e] uppercase">
              {isHostel ? "Hostel accommodation details" : "Student stay details"}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
              {listing.title}
            </h1>
            {listing.description && (
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                {listing.description}
              </p>
            )}

            {/* Top Info Row: Price & Owner */}
            <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
              <div className="rounded-[22px] border border-teal-500/20 bg-white p-4">
                <p className="text-xs font-bold tracking-wider text-[#0f766e] uppercase">
                  {isHostel ? "Monthly Rent per Bed" : "Monthly Rent"}
                </p>
                <p className="mt-1 text-3xl font-extrabold text-[#059669]">
                  ₹ {Number(listing.price || 0).toLocaleString("en-IN")}
                  <span className="ml-1 text-sm font-semibold text-slate-500">
                    {isHostel ? "/bed/month" : "/month"}
                  </span>
                </p>
              </div>

              <div className="rounded-[22px] border border-teal-500/20 bg-white p-4">
                <p className="text-xs font-bold tracking-wider text-[#0f766e] uppercase">
                  Owner
                </p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {listing.owner || "Host"}
                </p>
              </div>
            </div>

            {/* Info Grid Cards */}
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {infoItems.map(({ label, value }) => (
                <div
                  key={label}
                  className="min-h-[80px] rounded-[20px] border border-slate-300/25 bg-white p-3.5"
                >
                  <p className="text-xs font-bold tracking-wider text-[#0f766e] uppercase">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 break-words">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons (Edit / Delete) - Only rendered for listing owner */}
          <div className="mt-4 pt-2">
            <ListingActions listingId={listingId} isOwner={isOwner} />
          </div>
        </div>
      </section>

      {/* Middle & Bottom Sections: Map, Review Form & All Reviews */}
      <DetailInteractiveSections
        listingId={listingId}
        coordinates={coordinates}
        title={listing.title}
        location={listing.location}
        initialReviews={listing.reviews || []}
        currentUser={auth.user}
      />
    </div>
  );
}
