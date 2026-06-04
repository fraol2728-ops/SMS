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
        <h1 className="text-2xl font-black text-gray-900">Certificate</h1>
        <p className="text-gray-500 mt-1">Your certificate status</p>
      </div>

      {certificates.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center shadow-sm">
          <Award size={56} className="mx-auto text-gray-200 mb-4" />
          <h2 className="font-bold text-gray-400 text-xl">
            No certificate yet
          </h2>
          <p className="text-gray-300 text-sm mt-2 max-w-sm mx-auto">
            Your certificate will appear here once you complete your course and
            the admin processes it.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className={`bg-white rounded-3xl border shadow-sm overflow-hidden ${
                cert.isDelivered
                  ? "border-green-100"
                  : cert.paymentStatus === "PAID"
                    ? "border-blue-100"
                    : "border-amber-100"
              }`}
            >
              <div
                className={`p-5 ${
                  cert.isDelivered
                    ? "bg-gradient-to-r from-green-500 to-teal-500"
                    : cert.paymentStatus === "PAID"
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                      : "bg-gradient-to-r from-amber-400 to-orange-500"
                } text-white`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                    🎓
                  </div>
                  <div>
                    <p className="font-black text-xl">{cert.course.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {cert.isDelivered ? (
                        <>
                          <CheckCircle size={14} />
                          <span className="text-sm font-medium">
                            Certificate Delivered
                          </span>
                        </>
                      ) : cert.paymentStatus === "PAID" ? (
                        <>
                          <Package size={14} />
                          <span className="text-sm font-medium">
                            Ready to Collect
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock size={14} />
                          <span className="text-sm font-medium">
                            Payment Pending
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Status",
                      value: cert.isDelivered
                        ? "Delivered ✓"
                        : "Pending collection",
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
                        ? new Date(cert.deliveredAt).toLocaleDateString("en-GB")
                        : "—",
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-2xl p-3">
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                {!cert.isDelivered && cert.paymentStatus === "PENDING" && (
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <p className="text-sm text-amber-800 font-medium">
                      ⚠️ Certificate payment is pending
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Please contact the admin to complete your certificate
                      payment.
                    </p>
                  </div>
                )}
                {!cert.isDelivered && cert.paymentStatus === "PAID" && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <p className="text-sm text-blue-800 font-medium">
                      🎉 Your certificate is ready!
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Please visit the training center to collect your
                      certificate.
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
