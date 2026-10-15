import { notFound, redirect } from "next/navigation";
import { ListingForm } from "@/components/forms/ListingForm";
import { HostelForm } from "@/components/forms/HostelForm";
import { getListing } from "@/lib/data";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Enforce authentication (isLoggedIn)
  const auth = await api.auth.getCurrentUser();
  if (!auth.authenticated || !auth.user) {
    redirect(`/signin?returnTo=${encodeURIComponent(`/listings/${id}/edit`)}`);
  }

  let listing;
  try {
    listing = await getListing(id);
  } catch (err: any) {
    if (err?.status === 401) {
      redirect(`/signin?returnTo=${encodeURIComponent(`/listings/${id}/edit`)}`);
    }
    listing = null;
  }

  if (!listing) {
    notFound();
  }

  // Enforce ownership permission (isUser)
  const currentUserId = auth.user.id || auth.user._id;
  const listingOwnerId =
    listing.userId ||
    (typeof listing.user === "object" ? (listing.user?.id || listing.user?._id) : listing.user);

  if (!currentUserId || !listingOwnerId || String(currentUserId) !== String(listingOwnerId)) {
    redirect(`/listings/${id}`);
  }

  if (listing.listingType === "Hostel") {
    return <HostelForm listing={listing} />;
  }

  return <ListingForm listing={listing} />;
}
