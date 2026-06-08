export const dynamic = "force-dynamic";

import { CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { ExportCertificatesButton } from "@/components/admin/certificates/ExportButton";
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
      OR: [
        { student: { user: campusId ? { campusId } : undefined } },
        { studentId: null },
      ],
    },
    include: { student: { include: { user: true } }, course: true },
    orderBy: { issuedAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificates"
        description={`${certificates.length} pending certificate${certificates.length !== 1 ? "s" : ""}`}
        action={{ label: "Add Certificate", href: "/admin/certificates/new" }}
      />
      <div className="flex justify-end">
        <ExportCertificatesButton certificates={certificates} />
      </div>
      {certificates.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">🎓</p>
          <p className="font-semibold">No pending certificates</p>
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map((cert) => {
            const user = cert.student?.user;
            const studentName =
              cert.manualStudentName ??
              `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ??
              "Manual student";
            return (
              <Link key={cert.id} href={`/admin/certificates/${cert.id}`}>
                <div className="bg-white border rounded-xl p-5 hover:border-yellow-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-xl">
                        🎓
                      </div>
                      <div>
                        <p className="font-semibold">{studentName}</p>
                        <p className="text-sm text-muted-foreground">
                          {cert.course.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {cert.isDone ? (
                          <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 font-medium text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle size={11} /> Done
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-500 text-xs dark:bg-gray-700 dark:text-gray-400">
                            <Clock size={11} /> Pending
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${cert.paymentStatus === "PAID" || cert.paymentStatus === "PARTIAL" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}
                        >
                          {cert.paymentStatus}
                        </span>
                      </div>
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
