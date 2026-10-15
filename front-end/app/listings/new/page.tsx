import { redirect } from "next/navigation";
import { NewListingWizard } from "@/components/forms/NewListingWizard";
import { api } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewListingPage() {
  const auth = await api.auth.getCurrentUser();
  if (!auth.authenticated || !auth.user) {
    redirect("/signin?returnTo=/listings/new");
  }

  return <NewListingWizard />;
}
