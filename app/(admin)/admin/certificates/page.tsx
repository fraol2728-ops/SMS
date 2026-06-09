export const dynamic = "force-dynamic";

import { CertificatesClient } from "@/components/admin/certificates/CertificatesClient";
import { ExportCertificatesButton } from "@/components/admin/certificates/ExportButton";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function CertificatesPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
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
        action={{ label: "Add Certificate", href: "/admin/certificates/new" }}
      />
      <div className="flex justify-end">
        <ExportCertificatesButton certificates={allCerts} />
      </div>
      <CertificatesClient
        certificates={allCerts}
        stats={{
          total: allCerts.length,
          paid: paidCount,
          done: doneCount,
          delivered: deliveredCount,
        }}
      />
    </div>
  );
}
