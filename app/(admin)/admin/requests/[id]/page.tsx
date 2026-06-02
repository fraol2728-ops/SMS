export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { RequestDetailClient } from "@/components/admin/requests/RequestDetailClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";
export default async function RequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const request = await prisma.courseRequest.findUnique({
    where: { id: params.id },
  });
  if (!request) notFound();
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title={`${request.firstName} ${request.lastName}`}
        description="Course Request Details"
      />
      <RequestDetailClient request={request} />
    </div>
  );
}
