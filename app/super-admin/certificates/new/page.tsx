export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ManualCertificateForm } from "@/components/admin/certificates/ManualCertificateForm";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminNewCertificatePage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { campusId } = (await searchParams) ?? {};

  const courses = await prisma.course.findMany({
    where: { isActive: true, campusId: campusId ?? undefined },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <div className="max-w-lg space-y-6">
      <PageHeader title="Add Certificate Manually" />
      <ManualCertificateForm
        courses={courses}
        redirectTo={`/super-admin/certificates?campusId=${campusId ?? ""}`}
      />
    </div>
  );
}
