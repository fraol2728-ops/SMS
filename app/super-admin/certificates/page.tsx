export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
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

  const certificates = await prisma.certificate.findMany({
    where: {
      isDelivered: false,
      student: campusId ? { user: { campusId } } : undefined,
    },
    include: {
      student: { include: { user: true } },
      course: true,
    },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Certificates"
        description={`${certificates.length} pending`}
        action={{
          label: "Add Certificate",
          href: `/super-admin/certificates/new?campusId=${campusId ?? ""}`,
        }}
      />

      {certificates.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-3 text-4xl">🎓</p>
          <p className="font-semibold dark:text-white">
            No pending certificates
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map((certificate) => {
            const studentName =
              certificate.manualStudentName ??
              (certificate.student
                ? `${certificate.student.user.firstName} ${certificate.student.user.lastName}`
                : "—");
            return (
              <Link
                key={certificate.id}
                href={`/super-admin/certificates/${certificate.id}?campusId=${campusId ?? ""}`}
              >
                <div className="rounded-xl border bg-white p-5 transition-all hover:border-yellow-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-yellow-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-100 text-xl dark:bg-yellow-900/30">
                        🎓
                      </div>
                      <div>
                        <p className="font-semibold dark:text-white">
                          {studentName}
                        </p>
                        <p className="text-gray-500 text-sm dark:text-gray-400">
                          {certificate.course.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {certificate.isDone ? (
                        <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 font-medium text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">
                          <CheckCircle size={11} /> Done
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 font-medium text-gray-500 text-xs dark:bg-gray-700 dark:text-gray-400">
                          <Clock size={11} /> Pending
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          certificate.paymentStatus === "PAID" ||
                          certificate.paymentStatus === "PARTIAL"
                            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}
                      >
                        {certificate.paymentStatus}
                      </span>
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
