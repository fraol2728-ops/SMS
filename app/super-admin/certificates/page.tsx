export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CertificatesClient } from "@/components/admin/certificates/CertificatesClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminCertificatesPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { campusId } = (await searchParams) ?? {};
  const campusFilter = campusId ? { student: { user: { campusId } } } : {};

  const [allCerts, paidCount, doneCount, deliveredCount] = await Promise.all([
    prisma.certificate.findMany({
      where: campusFilter,
      include: { student: { include: { user: true } }, course: true },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.certificate.count({
      where: { paymentStatus: "PAID", ...campusFilter },
    }),
    prisma.certificate.count({
      where: { isDone: true, isDelivered: false, ...campusFilter },
    }),
    prisma.certificate.count({
      where: { isDelivered: true, ...campusFilter },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificates"
        action={{
          label: "Add Certificate",
          href: `/super-admin/certificates/new?campusId=${campusId ?? ""}`,
        }}
      />
      <CertificatesClient
        certificates={allCerts}
        stats={{
          total: allCerts.length,
          paid: paidCount,
          done: doneCount,
          delivered: deliveredCount,
        }}
        basePath="/super-admin"
      />
    </div>
  );
}
