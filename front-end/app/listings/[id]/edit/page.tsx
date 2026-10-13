import { ListingForm } from "@/components/forms/ListingForm";
import { getListing } from "@/lib/data";
export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ListingForm listing={getListing(id)} />; }
