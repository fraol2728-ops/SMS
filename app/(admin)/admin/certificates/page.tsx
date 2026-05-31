export const dynamic = "force-dynamic";

import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";
export default async function CertificatesPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const certificates = await prisma.certificate.findMany({
    where: {
      isDelivered: false,
      student: { user: campusId ? { campusId } : undefined },
    },
    include: { student: { include: { user: true } }, course: true },
    orderBy: { issuedAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificates"
        description={`${certificates.length} pending certificate${certificates.length !== 1 ? "s" : ""}`}
      />
      {certificates.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">🎓</p>
          <p className="font-semibold">No pending certificates</p>
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map((cert) => {
            const user = cert.student.user;
            return (
              <Link key={cert.id} href={`/admin/certificates/${cert.id}`}>
                <div className="bg-white border rounded-xl p-5 hover:border-yellow-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-xl">
                        🎓
                      </div>
                      <div>
                        <p className="font-semibold">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {cert.course.title}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${cert.paymentStatus === "PAID" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                      >
                        {cert.paymentStatus}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(cert.issuedAt).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
