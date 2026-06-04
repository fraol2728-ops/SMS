export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { COCDetailClient } from "@/components/admin/coc/COCDetailClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminCOCDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { id } = await params;
  const { campusId } = (await searchParams) ?? {};
  const student = await prisma.cOCStudent.findUnique({
    where: { id },
    include: {
      studentProfile: { include: { user: true } },
      campus: true,
    },
  });
  if (!student) notFound();

  const query = campusId ? `?campusId=${campusId}` : "";

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={`/super-admin/coc${query}`}>
        <button
          className="text-gray-500 text-sm hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          type="button"
        >
          ← Back
        </button>
      </Link>
      <PageHeader title={student.fullName} description="COC Student" />
      <COCDetailClient student={student} />
    </div>
  );
}
