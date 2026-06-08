export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { Award, CheckCircle, Clock, Package } from "lucide-react";
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
        },
      },
    },
  });

  if (!student) redirect("/sign-in");
  const certificates = student.studentProfile?.certificates ?? [];

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
            Your certificate will appear here once you complete your course and
            the admin processes it.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${
                cert.isDone
                  ? "border-green-100"
                  : cert.isDelivered
                    ? "border-blue-100"
                    : cert.paymentStatus === "PAID" ||
                        cert.paymentStatus === "PARTIAL"
                      ? "border-amber-100"
                      : "border-gray-100"
              }`}
            >
              <div
                className={`p-5 text-white ${
                  cert.isDone
                    ? "bg-gradient-to-r from-green-500 to-teal-500"
                    : cert.isDelivered
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                      : cert.paymentStatus === "PAID" ||
                          cert.paymentStatus === "PARTIAL"
                        ? "bg-gradient-to-r from-amber-400 to-orange-500"
                        : "bg-gradient-to-r from-gray-400 to-gray-500"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl">
                    🎓
                  </div>
                  <div>
                    <p className="font-black text-xl">{cert.course.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {cert.isDone ? (
                        <>
                          <Package size={14} />
                          <span className="font-medium text-sm">
                            Certificate is Ready — Come collect it!
                          </span>
                        </>
                      ) : cert.isDelivered ? (
                        <>
                          <CheckCircle size={14} />
                          <span className="font-medium text-sm">
                            Certificate Delivered
                          </span>
                        </>
                      ) : cert.paymentStatus === "PAID" ||
                        cert.paymentStatus === "PARTIAL" ? (
                        <>
                          <Clock size={14} />
                          <span className="font-medium text-sm">
                            Waiting for certificate to be printed
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock size={14} />
                          <span className="font-medium text-sm">
                            Payment Pending
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3 p-5">
                {cert.isDone && !cert.isDelivered && (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
                    <p className="mb-2 text-4xl">🎓</p>
                    <p className="font-black text-green-800 text-lg">
                      Your Certificate is Ready!
                    </p>
                    <p className="mt-1 text-green-600 text-sm">
                      Please visit the training center to collect your
                      certificate.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: "Status",
                      value: cert.isDone
                        ? "Ready for collection ✓"
                        : cert.isDelivered
                          ? "Delivered ✓"
                          : "Pending",
                    },
                    { label: "Payment", value: cert.paymentStatus },
                    {
                      label: "Certificate Ready",
                      value: cert.isDone
                        ? `✅ Yes — ${cert.doneAt ? new Date(cert.doneAt).toLocaleDateString("en-GB") : "ready"}`
                        : "⏳ Not yet",
                    },
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
                        ? new Date(cert.deliveredAt).toLocaleDateString("en-GB")
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
                {!cert.isDone &&
                  !cert.isDelivered &&
                  cert.paymentStatus === "PENDING" && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <p className="font-medium text-amber-800 text-sm">
                        ⚠️ Certificate payment is pending
                      </p>
                      <p className="mt-1 text-amber-600 text-xs">
                        Please contact the admin to complete your certificate
                        payment.
                      </p>
                    </div>
                  )}
                {!cert.isDone &&
                  !cert.isDelivered &&
                  (cert.paymentStatus === "PAID" ||
                    cert.paymentStatus === "PARTIAL") && (
                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <p className="font-medium text-amber-800 text-sm">
                        ⏳ Waiting for certificate to be printed
                      </p>
                      <p className="mt-1 text-amber-600 text-xs">
                        Your payment is recorded. We will update this page when
                        the certificate is ready.
                      </p>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
