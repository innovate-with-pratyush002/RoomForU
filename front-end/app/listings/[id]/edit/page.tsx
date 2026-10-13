import { notFound } from "next/navigation";
import { ListingForm } from "@/components/forms/ListingForm";
import { getListing } from "@/lib/data";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);

  if (!listing) {
    notFound();
  }

  return <ListingForm listing={listing} />;
}
