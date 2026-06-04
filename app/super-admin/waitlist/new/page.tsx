export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { WaitlistForm } from "@/components/admin/waitlist/WaitlistForm";

export default async function SuperAdminNewWaitlistPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { campusId } = (await searchParams) ?? {};

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader title="Add to Waiting List" />
      <WaitlistForm
        redirectTo={`/super-admin/waitlist?campusId=${campusId ?? ""}`}
      />
    </div>
  );
}
