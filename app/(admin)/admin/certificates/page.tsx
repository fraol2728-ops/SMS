export const dynamic = "force-dynamic";

import Link from "next/link";
import { ExportCertificatesButton } from "@/components/admin/certificates/ExportButton";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function CertificatesPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const studentCampusFilter = campusId ? { user: { campusId } } : undefined;

  const certificates = await prisma.certificate.findMany({
    where: {
      isDelivered: false,
      student: studentCampusFilter,
    },
    include: {
      student: { include: { user: true } },
      course: true,
      claimedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { issuedAt: "desc" },
  });

  const [totalClaimed, paidCount, doneCount, deliveredCount] =
    await Promise.all([
      prisma.certificate.count({ where: { student: studentCampusFilter } }),
      prisma.certificate.count({
        where: { paymentStatus: "PAID", student: studentCampusFilter },
      }),
      prisma.certificate.count({
        where: {
          isDone: true,
          isDelivered: false,
          student: studentCampusFilter,
        },
      }),
      prisma.certificate.count({
        where: { isDelivered: true, student: studentCampusFilter },
      }),
    ]);

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
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Total Claimed",
            value: totalClaimed,
            color: "bg-blue-50 dark:bg-blue-900/20",
            textColor: "text-blue-700 dark:text-blue-400",
            emoji: "🎓",
          },
          {
            label: "Cert Payment Paid",
            value: paidCount,
            color: "bg-green-50 dark:bg-green-900/20",
            textColor: "text-green-700 dark:text-green-400",
            emoji: "✅",
          },
          {
            label: "Mark as Done",
            value: doneCount,
            color: "bg-indigo-50 dark:bg-indigo-900/20",
            textColor: "text-indigo-700 dark:text-indigo-400",
            emoji: "📦",
          },
          {
            label: "Delivered",
            value: deliveredCount,
            color: "bg-teal-50 dark:bg-teal-900/20",
            textColor: "text-teal-700 dark:text-teal-400",
            emoji: "🚀",
          },
        ].map(({ label, value, color, textColor, emoji }) => (
          <div key={label} className={`${color} rounded-2xl p-5`}>
            <p className="mb-1 text-2xl">{emoji}</p>
            <p className={`font-black text-3xl ${textColor}`}>{value}</p>
            <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
              {label}
            </p>
          </div>
        ))}
      </div>
      {certificates.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="mb-3 text-4xl">🎓</p>
          <p className="font-semibold">No pending certificates</p>
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map((cert) => {
            const user = cert.student?.user;
            const studentName =
              cert.manualStudentName ??
              (`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() ||
                "Manual student");
            return (
              <Link key={cert.id} href={`/admin/certificates/${cert.id}`}>
                <div className="rounded-xl border bg-white p-5 transition-all hover:border-yellow-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-yellow-700">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 font-bold text-xl text-yellow-700">
                        🎓
                      </div>
                      <div>
                        <p className="font-semibold dark:text-white">
                          {studentName}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {cert.course.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 font-medium text-xs ${
                            cert.isDelivered
                              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {cert.isDelivered ? "✓ Delivered" : "⏳ Pending"}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 font-medium text-xs ${
                            cert.paymentStatus === "PAID"
                              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                          }`}
                        >
                          Payment: {cert.paymentStatus}
                        </span>
                      </div>
                      <p className="mt-1 text-muted-foreground text-xs">
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
