export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { RequestDetailClient } from "@/components/admin/requests/RequestDetailClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { id } = await params;
  const { campusId } = (await searchParams) ?? {};
  const request = await prisma.courseRequest.findUnique({ where: { id } });
  if (!request) notFound();

  const query = campusId ? `?campusId=${campusId}` : "";

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={`/super-admin/requests${query}`}>
        <button
          className="text-gray-500 text-sm hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          type="button"
        >
          ← Back
        </button>
      </Link>
      <PageHeader title={`${request.firstName} ${request.lastName}`} />
      <RequestDetailClient
        request={request}
        redirectTo="/super-admin/requests"
        studentCreateBasePath="/super-admin/students/new"
      />
    </div>
  );
}
