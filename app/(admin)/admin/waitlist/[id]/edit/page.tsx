export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { WaitlistForm } from "@/components/admin/waitlist/WaitlistForm";
import { requireAdmin } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function EditWaitlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const entry = await prisma.teacherWaitlist.findUnique({ where: { id } });
  if (!entry) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title="Edit Waiting List Entry" />
      <WaitlistForm defaultValues={entry} />
    </div>
  );
}
