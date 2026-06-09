export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { Award, CheckCircle, Clock } from "lucide-react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function StudentCertificatePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const student = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      studentProfile: {
        include: {
          certificates: {
            include: { course: true },
            orderBy: { issuedAt: "desc" },
          },
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              paymentRemaining: {
                select: { remainingAmount: true, status: true },
              },
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!student) redirect("/sign-in");

  const certificates = student.studentProfile?.certificates ?? [];
  const activeEnrollment = student.studentProfile?.enrollments[0];
  const remainingBalance = activeEnrollment?.paymentRemaining;
  const hasOutstanding =
    remainingBalance &&
    remainingBalance.status !== "PAID" &&
    remainingBalance.remainingAmount > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-black text-2xl text-gray-900">Certificate</h1>
        <p className="mt-1 text-gray-500">Your certificate status</p>
      </div>

      {certificates.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center shadow-sm">
          <Award size={56} className="mx-auto mb-4 text-gray-200" />
          <h2 className="font-bold text-gray-400 text-xl">
            No certificate yet
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-gray-300 text-sm">
            Your certificate will appear here once your admin processes it.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {certificates.map((cert) => {
            const statusHeader = cert.isDelivered
              ? {
                  gradient: "from-green-500 to-teal-500",
                  label: "Certificate Delivered",
                  icon: "✅",
                }
              : cert.isDone
                ? {
                    gradient: "from-blue-500 to-indigo-600",
                    label: "Certificate is Ready!",
                    icon: "📦",
                  }
                : {
                    gradient: "from-blue-500 to-indigo-600",
                    label: "Being Processed",
                    icon: "⏳",
                  };

            return (
              <div
                key={cert.id}
                className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
              >
                <div
                  className={`bg-gradient-to-r ${statusHeader.gradient} p-6 text-white`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl">
                      {statusHeader.icon}
                    </div>
                    <div>
                      <p className="font-black text-xl">{cert.course.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        {cert.isDelivered ? (
                          <CheckCircle size={14} />
                        ) : (
                          <Clock size={14} />
                        )}
                        <span className="font-medium text-sm">
                          {statusHeader.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        label: "Status",
                        value: cert.isDelivered
                          ? "Delivered ✓"
                          : cert.isDone
                            ? "Ready to collect"
                            : "Being Processed",
                      },
                      { label: "Payment", value: cert.paymentStatus },
                      {
                        label: "Issued",
                        value: new Date(cert.issuedAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        ),
                      },
                      {
                        label: "Delivered",
                        value: cert.deliveredAt
                          ? new Date(cert.deliveredAt).toLocaleDateString(
                              "en-GB",
                            )
                          : "—",
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-2xl bg-gray-50 p-3">
                        <p className="mb-1 text-gray-400 text-xs">{label}</p>
                        <p className="font-semibold text-gray-900 text-sm">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {cert.isDone && !cert.isDelivered && (
                    <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 text-center">
                      <p className="mb-2 text-4xl">🎓</p>
                      <p className="font-black text-blue-900 text-xl">
                        Your Certificate is Ready!
                      </p>
                      <p className="mt-1 text-blue-700 text-sm">
                        Please visit the training center to collect your
                        certificate.
                      </p>
                    </div>
                  )}

                  {!cert.isDone && !cert.isDelivered && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <p className="font-bold text-blue-800 text-sm">
                        ⏳ Being processed
                      </p>
                      <p className="mt-1 text-blue-600 text-xs">
                        You will be notified when your certificate is ready.
                      </p>
                    </div>
                  )}

                  {cert.isDelivered && (
                    <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                      <p className="font-bold text-green-800 text-sm">
                        🎉 Certificate delivered!
                      </p>
                      <p className="mt-1 text-green-600 text-xs">
                        Your certificate has been collected.
                      </p>
                    </div>
                  )}

                  {hasOutstanding && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <p className="font-bold text-amber-800 text-sm">
                        ⚠️ Outstanding Balance
                      </p>
                      <p className="mt-1 text-amber-700 text-xs">
                        You have ETB{" "}
                        {remainingBalance!.remainingAmount.toLocaleString()}{" "}
                        remaining. Pay before collecting your certificate.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
