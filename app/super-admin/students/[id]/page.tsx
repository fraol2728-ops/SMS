export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SuperAdminClaimCertificateButton } from "@/components/admin/certificates/SuperAdminClaimCertificateButton";
import { ContactButtons } from "@/components/shared/ContactButtons";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminStudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const { campusId } = (await searchParams) ?? {};

  const student = await prisma.user.findUnique({
    where: { id },
    include: {
      studentProfile: {
        include: {
          enrollments: {
            include: {
              class: {
                include: {
                  course: true,
                  lab: true,
                  teacher: { include: { user: true } },
                },
              },
              payments: { orderBy: { createdAt: "desc" }, take: 3 },
              attendance: { orderBy: { date: "desc" }, take: 30 },
              paymentRemaining: { where: { status: { not: "PAID" } } },
            },
            orderBy: { createdAt: "desc" },
          },
          assessment: true,
        },
      },
      campus: true,
    },
  });

  if (!student?.studentProfile) notFound();

  const activeEnrollment = student.studentProfile.enrollments.find(
    (enrollment) => enrollment.status === "ACTIVE",
  );
  const activeRemaining = activeEnrollment?.paymentRemaining;
  const hasRemaining = (activeRemaining?.remainingAmount ?? 0) > 0;

  const latestPayment = activeEnrollment?.id
    ? await prisma.payment.findFirst({
        where: { enrollmentId: activeEnrollment.id },
        orderBy: { createdAt: "desc" },
        select: { receiptNumber: true, id: true },
      })
    : null;

  const receiptNumber = latestPayment?.receiptNumber ?? null;

  return (
    <div className="max-w-4xl space-y-6">
      <Link href={`/super-admin/students?campusId=${campusId ?? ""}`}>
        <button
          className="mb-2 flex items-center gap-2 text-gray-500 text-sm transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          type="button"
        >
          ← Back to Students
        </button>
      </Link>

      <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 font-bold text-2xl text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {student.firstName[0]}
            {student.lastName[0]}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-2xl text-gray-900 dark:text-white">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {student.studentProfile.studentCode}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-gray-400 text-sm">
              {student.phone ? <span>📱 {student.phone}</span> : null}
              {student.gender ? <span>{student.gender}</span> : null}
              {student.campus?.name ? (
                <span>🏫 {student.campus.name}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <ContactButtons
            phone={student.phone}
            telegram={student.telegram}
            whatsapp={student.whatsapp}
            showTelegramWhatsapp={true}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            label: "Email",
            value: student.email.includes("@exceed.local")
              ? "—"
              : student.email,
          },
          { label: "Phone", value: student.phone ?? "—" },
          { label: "Gender", value: student.gender ?? "—" },
          { label: "Address", value: student.address ?? "—" },
          {
            label: "Guardian",
            value: student.studentProfile.guardianName ?? "—",
          },
          {
            label: "Guardian Phone",
            value: student.studentProfile.guardianPhone ?? "—",
          },
          { label: "Telegram", value: student.telegram ?? "—" },
          { label: "WhatsApp", value: student.whatsapp ?? "—" },
          {
            label: "Registration Date",
            value: student.studentProfile.registrationDate
              ? new Date(
                  student.studentProfile.registrationDate,
                ).toLocaleDateString("en-GB")
              : new Date(student.createdAt).toLocaleDateString("en-GB"),
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <p className="mb-1 text-gray-400 text-xs">{label}</p>
            <p className="truncate font-medium text-sm dark:text-white">
              {value}
            </p>
          </div>
        ))}
      </div>

      {activeEnrollment ? (
        <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 font-semibold dark:text-white">
            Current Enrollment
          </h2>
          <div className="mb-4 flex flex-wrap gap-2">
            <SuperAdminClaimCertificateButton
              student={{
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                fullNameAmharic: null,
              }}
              studentProfileId={student.studentProfile.id}
              courseId={activeEnrollment.class?.course?.id ?? ""}
              courseTitle={activeEnrollment.class?.course?.title ?? ""}
              enrollmentId={activeEnrollment.id}
              remainingBalance={activeRemaining?.remainingAmount ?? null}
              initialReceiptNumber={receiptNumber}
              redirectPath={`/super-admin/certificates?campusId=${campusId ?? ""}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              {
                label: "Course",
                value: activeEnrollment.class?.course?.title ?? "—",
              },
              {
                label: "Lab",
                value:
                  activeEnrollment.class?.lab?.name ??
                  (activeEnrollment.class?.classType === "ONLINE"
                    ? "Online"
                    : "—"),
              },
              {
                label: "Time",
                value: activeEnrollment.class
                  ? TIME_SLOTS[
                      activeEnrollment.class.timeSlot as keyof typeof TIME_SLOTS
                    ]
                  : "—",
              },
              {
                label: "Days",
                value: activeEnrollment.class
                  ? CLASS_DAYS[
                      activeEnrollment.class.days as keyof typeof CLASS_DAYS
                    ]
                  : "—",
              },
              {
                label: "Teacher",
                value: activeEnrollment.class?.teacher
                  ? `${activeEnrollment.class.teacher.user.firstName} ${activeEnrollment.class.teacher.user.lastName}`
                  : "—",
              },
              {
                label: "Start Date",
                value: new Date(activeEnrollment.startDate).toLocaleDateString(
                  "en-GB",
                ),
              },
              {
                label: "End Date",
                value: activeEnrollment.endDate
                  ? new Date(activeEnrollment.endDate).toLocaleDateString(
                      "en-GB",
                    )
                  : "—",
              },
              { label: "Status", value: activeEnrollment.status },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800"
              >
                <p className="mb-1 text-gray-400 text-xs">{label}</p>
                <p className="font-medium text-sm dark:text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeEnrollment && activeEnrollment.payments.length > 0 ? (
        <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 font-semibold dark:text-white">Payments</h2>
          <div className="space-y-3">
            {activeEnrollment.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800"
              >
                <div>
                  <p className="font-medium text-sm dark:text-white">
                    ETB {payment.amount.toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {payment.method ?? "—"} •{" "}
                    {new Date(payment.createdAt).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 font-medium text-xs ${payment.status === "PAID" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}
                >
                  {payment.status}
                </span>
              </div>
            ))}
          </div>

          {hasRemaining ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="font-medium text-amber-800 text-sm dark:text-amber-400">
                ⚠️ Remaining Balance: ETB{" "}
                {activeRemaining?.remainingAmount.toLocaleString()}
              </p>
              <p className="mt-1 text-amber-600 text-xs dark:text-amber-500">
                Due:{" "}
                {activeRemaining?.dueDate
                  ? new Date(activeRemaining.dueDate).toLocaleDateString(
                      "en-GB",
                    )
                  : "—"}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {activeEnrollment && activeEnrollment.attendance.length > 0 ? (
        <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 font-semibold dark:text-white">
            Recent Attendance
          </h2>
          <div className="flex flex-wrap gap-2">
            {activeEnrollment.attendance.map((attendance) => (
              <div
                key={attendance.id}
                title={new Date(attendance.date).toLocaleDateString("en-GB")}
                className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs ${attendance.status === "PRESENT" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : attendance.status === "ABSENT" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}
              >
                {attendance.status === "PRESENT"
                  ? "✓"
                  : attendance.status === "ABSENT"
                    ? "✗"
                    : "L"}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {student.studentProfile.assessment ? (
        <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-4 font-semibold dark:text-white">
            Student Assessment
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                label: "Basic Computer Knowledge",
                value:
                  student.studentProfile.assessment
                    .hasBasicComputerKnowledge === true
                    ? "✅ Yes"
                    : student.studentProfile.assessment
                          .hasBasicComputerKnowledge === false
                      ? "❌ No"
                      : "—",
              },
              {
                label: "Has Active Email",
                value:
                  student.studentProfile.assessment.hasActiveEmail === true
                    ? "✅ Yes"
                    : student.studentProfile.assessment.hasActiveEmail === false
                      ? "❌ No"
                      : "—",
              },
              {
                label: "Has Device",
                value:
                  student.studentProfile.assessment.hasDevice === true
                    ? "✅ Yes"
                    : student.studentProfile.assessment.hasDevice === false
                      ? "❌ No"
                      : "—",
              },
              {
                label: "Has Internet",
                value:
                  student.studentProfile.assessment.hasInternetConnection ===
                  true
                    ? "✅ Yes"
                    : student.studentProfile.assessment
                          .hasInternetConnection === false
                      ? "❌ No"
                      : "—",
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800"
              >
                <p className="mb-1 text-gray-400 text-xs">{label}</p>
                <p className="font-medium text-sm dark:text-white">{value}</p>
              </div>
            ))}

            {student.studentProfile.assessment.socialMediaPlatforms.length >
            0 ? (
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800 sm:col-span-2">
                <p className="mb-2 text-gray-400 text-xs">
                  Social Media Platforms
                </p>
                <div className="flex flex-wrap gap-2">
                  {student.studentProfile.assessment.socialMediaPlatforms.map(
                    (platform) => (
                      <span
                        key={platform}
                        className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-400"
                      >
                        {platform}
                      </span>
                    ),
                  )}
                </div>
              </div>
            ) : null}

            {student.studentProfile.assessment.courseUnderstanding.length >
            0 ? (
              <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800 sm:col-span-2">
                <p className="mb-2 text-gray-400 text-xs">
                  Course Understanding
                </p>
                <div className="flex flex-wrap gap-2">
                  {student.studentProfile.assessment.courseUnderstanding.map(
                    (understanding) => (
                      <span
                        key={understanding}
                        className="rounded-full bg-purple-50 px-2 py-1 text-purple-700 text-xs dark:bg-purple-900/30 dark:text-purple-400"
                      >
                        {understanding}
                      </span>
                    ),
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
