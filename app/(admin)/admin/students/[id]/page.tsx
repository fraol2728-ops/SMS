import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { AddCOCModal } from "@/components/admin/students/AddCOCModal";
import { ChangeClassModal } from "@/components/admin/students/ChangeClassModal";
import { ClaimCertificateModal } from "@/components/admin/students/ClaimCertificateModal";
import { DropButton } from "@/components/admin/students/DropButton";
import { WithdrawModal } from "@/components/admin/students/WithdrawModal";
import { ContactButtons } from "@/components/shared/ContactButtons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

type AttendanceRecord = {
  id: string;
  date: Date;
  status: string;
  note: string | null;
};

type PaymentRecord = {
  id: string;
  amount: number;
  method: string | null;
  status: string;
  createdAt: Date;
  receiptUrl: string | null;
};

type EnrollmentRecord = {
  id: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  classId: string | null;
  class: {
    lab: { name: string } | null;
    timeSlot: string;
    days: string;
    course: { title: string };
  } | null;
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
};

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ campusId?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { campusId: listCampusId } = (await searchParams) ?? {};
  const backHref = listCampusId
    ? `/super-admin/students?campusId=${listCampusId}`
    : "/admin/students";
  const student = await prisma.user.findUnique({
    where: { id },
    include: {
      studentProfile: {
        include: {
          assessment: true,
          enrollments: {
            include: {
              class: {
                include: { course: true, lab: { select: { name: true } } },
              },
              attendance: {
                include: {
                  class: { include: { lab: { select: { name: true } } } },
                },
              },
              payments: true,
              paymentRemaining: true,
            },
          },
        },
      },
    },
  });
  if (!student) notFound();

  const campusId = await getCurrentUserCampusId();
  const availableClasses = await prisma.class.findMany({
    where: {
      campusId: campusId ?? undefined,
      isActive: true,
      status: "REGISTRATION",
    },
    include: {
      course: { select: { title: true } },
      lab: { select: { name: true } },
      teacher: {
        include: { user: { select: { firstName: true, lastName: true } } },
      },
      _count: {
        select: { enrollments: { where: { status: "ACTIVE" } } },
      },
    },
    orderBy: [{ lab: { name: "asc" } }, { timeSlot: "asc" }],
  });

  const enrollments = student.studentProfile?.enrollments ?? [];
  const attendanceRecords = enrollments.flatMap(
    (enrollment) => enrollment.attendance,
  );
  const presentCount = attendanceRecords.filter(
    (record) => record.status === "PRESENT",
  ).length;
  const attendanceRate = attendanceRecords.length
    ? Math.round((presentCount / attendanceRecords.length) * 100)
    : 0;
  const recentAttendance = [...attendanceRecords]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-7);
  const paymentRecords = enrollments.flatMap(
    (enrollment) => enrollment.payments,
  );
  const totalPaid = paymentRecords
    .filter((payment) => payment.status === "PAID")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const outstandingPayments = paymentRecords.filter(
    (payment) => payment.status !== "PAID",
  ).length;
  const activeEnrollments = enrollments.filter(
    (enrollment) => enrollment.status === "ACTIVE",
  ).length;
  const activeEnrollment = enrollments.find(
    (enrollment) => enrollment.status === "ACTIVE",
  );
  const remainingAmount =
    (activeEnrollment as any)?.paymentRemaining?.remainingAmount ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit gap-2 text-muted-foreground hover:text-foreground"
      >
        <Link href={backHref}>
          <ArrowLeft size={16} />
          Back to students
        </Link>
      </Button>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-5 sm:gap-6">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-600 text-2xl font-semibold text-white shadow-lg sm:size-16">
                  {student.firstName[0]}
                  {student.lastName[0]}
                </div>
                <div className="min-w-0 w-full space-y-3">
                  <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start sm:gap-3">
                    <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                      {student.firstName} {student.lastName}
                    </h1>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wider text-foreground">
                      {student.gender ?? "Student"}
                    </span>
                  </div>
                  <div className="grid w-full gap-2.5 text-left sm:grid-cols-2">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">ID:</span>{" "}
                      {student.studentProfile?.studentCode ?? "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Phone:</span>{" "}
                      {student.phone ?? "N/A"}
                    </p>
                    <p className="break-all text-sm text-muted-foreground sm:col-span-2">
                      <span className="font-medium text-foreground">Email:</span>{" "}
                      {student.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Address:
                      </span>{" "}
                      {student.address ?? "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              <ContactButtons
                phone={student.phone}
                telegram={student.telegram}
                whatsapp={student.whatsapp}
                showTelegramWhatsapp
              />

              <div className="rounded-2xl border border-border bg-muted/40 p-4 shadow-sm sm:rounded-3xl sm:p-5 dark:bg-muted/20">
                <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Guardian
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {student.studentProfile?.guardianName ?? "-"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {student.studentProfile?.guardianPhone ??
                        "No phone listed"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Emergency contact
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {student.studentProfile?.emergencyContact ?? "Not set"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm sm:rounded-3xl">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        Attendance performance
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {attendanceRate}% present
                      </p>
                    </div>
                    <div className="w-fit rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-wider text-foreground">
                      Last {recentAttendance.length} sessions
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
                    {recentAttendance.length ? (
                      recentAttendance.map((record, index) => (
                        <div
                          key={`${record.id}-${index}`}
                          className="flex flex-col items-center gap-2"
                        >
                          <div
                            className={`h-12 w-full rounded-xl ${record.status === "PRESENT" ? "bg-emerald-500" : "bg-muted-foreground/30 dark:bg-muted-foreground/50"}`}
                            style={{ minHeight: 36 }}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {record.date.toLocaleDateString(undefined, {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-4 rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground sm:col-span-7">
                        No attendance history yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <Button asChild className="h-10 w-full">
                    <Link href={`/admin/students/${student.id}/edit`}>
                      Edit student
                    </Link>
                  </Button>
                  <ClaimCertificateModal
                    studentId={student.id}
                    studentName={`${student.firstName} ${student.lastName}`}
                    courseName={
                      activeEnrollment?.class?.course.title ?? "Course"
                    }
                    hasRemaining={remainingAmount > 0}
                    remainingAmount={remainingAmount}
                  />
                  {student.studentProfile ? (
                    <div className="sm:col-span-2 lg:col-span-1">
                      <AddCOCModal
                        studentProfileId={student.studentProfile.id}
                        studentName={`${student.firstName} ${student.lastName}`}
                        phone={student.phone}
                        gender={student.gender}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-border">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                Active enrollments
              </p>
              <p className="text-3xl font-semibold text-foreground">
                {activeEnrollments}
              </p>
              <p className="text-sm text-muted-foreground">
                Classes currently in progress
              </p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                Attendance rate
              </p>
              <p className="text-3xl font-semibold text-foreground">
                {attendanceRate}%
              </p>
              <p className="text-sm text-muted-foreground">
                Based on recorded sessions
              </p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                Payments paid
              </p>
              <p className="text-3xl font-semibold text-foreground">
                ETB {totalPaid.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Confirmed payments received
              </p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                Outstanding payments
              </p>
              <p className="text-3xl font-semibold text-foreground">
                {outstandingPayments}
              </p>
              <p className="text-sm text-muted-foreground">
                Payments awaiting completion
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="overflow-hidden">
        <Tabs defaultValue="enrollments">
          <CardContent className="space-y-5 p-4 sm:space-y-6 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                  Student activity
                </h2>
                <p className="text-sm text-muted-foreground">
                  Review enrollments, attendance, and payment history.
                </p>
              </div>
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl p-1 sm:w-auto sm:grid-cols-4 sm:rounded-full">
                <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="assessment">Assessment</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="enrollments" className="space-y-4">
              {enrollments.length ? (
                enrollments.map((enrollment: EnrollmentRecord) => {
                  const classRecord = enrollment.class;
                  const timeLabel = classRecord
                    ? TIME_SLOTS[
                        classRecord.timeSlot as keyof typeof TIME_SLOTS
                      ]
                    : "-";
                  const daysLabel = classRecord
                    ? CLASS_DAYS[classRecord.days as keyof typeof CLASS_DAYS]
                    : "-";

                  return (
                    <Card key={enrollment.id} className="border-border">
                      <CardContent className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="rounded-full bg-muted px-3 py-1 text-foreground">
                              {enrollment.status}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {classRecord
                              ? `${classRecord.course.title}`
                              : "No class assigned"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {classRecord
                              ? `${classRecord.lab?.name ?? "Online"} · ${timeLabel} · ${daysLabel}`
                              : "Class details unavailable"}
                          </p>
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span>
                              Start {enrollment.startDate.toLocaleDateString()}
                            </span>
                            <span>
                              End{" "}
                              {enrollment.endDate?.toLocaleDateString() ??
                                "Ongoing"}
                            </span>
                          </div>
                        </div>
                        <div className="flex w-full flex-col gap-3 border-border border-t pt-4 sm:items-end sm:border-t-0 sm:pt-0 lg:border-t-0">
                          <StatusBadge status={enrollment.status} />
                          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end">
                            {enrollment.status === "ACTIVE" ? (
                              <ChangeClassModal
                                enrollmentId={enrollment.id}
                                currentClassId={enrollment.classId ?? ""}
                                studentName={`${student.firstName} ${student.lastName}`}
                                availableClasses={availableClasses}
                              />
                            ) : null}
                            <WithdrawModal
                              enrollmentId={enrollment.id}
                              studentName={`${student.firstName} ${student.lastName}`}
                            />
                            <DropButton
                              enrollmentId={enrollment.id}
                              studentName={`${student.firstName} ${student.lastName}`}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
                  No enrollments found for this student.
                </div>
              )}
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              {enrollments.length ? (
                enrollments.map((enrollment: EnrollmentRecord) => {
                  const total = enrollment.attendance.length;
                  const present = enrollment.attendance.filter(
                    (attendance: AttendanceRecord) =>
                      attendance.status === "PRESENT",
                  ).length;
                  const pct = total ? Math.round((present / total) * 100) : 0;

                  return (
                    <Card key={enrollment.id} className="border-border">
                      <CardContent className="space-y-4 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              {enrollment.class?.course.title ?? "Attendance"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Attendance summary for this class
                            </p>
                          </div>
                          <div className="rounded-3xl bg-muted px-4 py-2 text-sm font-semibold text-foreground">
                            {pct}% present
                          </div>
                        </div>
                        <Progress value={pct} />
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm text-foreground">
                            <thead className="border-b border-border text-left text-xs uppercase tracking-[0.16em] text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2">Date</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Note</th>
                              </tr>
                            </thead>
                            <tbody>
                              {enrollment.attendance.map(
                                (attendance: AttendanceRecord) => (
                                  <tr
                                    key={attendance.id}
                                    className="border-b border-border/60"
                                  >
                                    <td className="px-3 py-3">
                                      {attendance.date.toLocaleDateString()}
                                    </td>
                                    <td className="px-3 py-3">
                                      <StatusBadge status={attendance.status} />
                                    </td>
                                    <td className="px-3 py-3 text-muted-foreground">
                                      {attendance.note ?? "-"}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
                  No attendance records available yet.
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              {paymentRecords.length ? (
                paymentRecords.map((payment: PaymentRecord) => (
                  <Card key={payment.id} className="border-border">
                    <CardContent className="grid gap-4 md:grid-cols-[1.4fr_0.6fr] md:items-center">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          ETB {payment.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.method ?? "Payment method not specified"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-3 sm:items-end">
                        <StatusBadge status={payment.status} />
                        {payment.receiptUrl ? (
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-foreground hover:text-muted-foreground"
                          >
                            View receipt
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            No receipt
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
                  No payment history yet.
                </div>
              )}
            </TabsContent>

            <TabsContent value="assessment" className="space-y-4">
              {student.studentProfile?.assessment ? (
                <Card className="border-border">
                  <CardContent className="space-y-5 p-5">
                    <h3 className="text-lg font-semibold text-foreground">
                      Student Assessment
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        [
                          "Basic computer knowledge",
                          student.studentProfile.assessment
                            .hasBasicComputerKnowledge,
                        ],
                        [
                          "Active email",
                          student.studentProfile.assessment.hasActiveEmail,
                        ],
                        [
                          "Can login email",
                          student.studentProfile.assessment.canLoginEmail,
                        ],
                        [
                          "Has device",
                          student.studentProfile.assessment.hasDevice,
                        ],
                        [
                          "Has internet",
                          student.studentProfile.assessment
                            .hasInternetConnection,
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={String(label)}
                          className="rounded-lg bg-muted/50 p-3"
                        >
                          <p className="text-xs text-muted-foreground">
                            {String(label)}
                          </p>
                          <span
                            className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ${value ? "bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400"}`}
                          >
                            {value ? "✓ Yes" : "✗ No"}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="mb-2 text-xs text-muted-foreground">
                        Course understanding
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {student.studentProfile.assessment.courseUnderstanding.map(
                          (v) => (
                            <span
                              key={v}
                              className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800 dark:bg-blue-950/60 dark:text-blue-400"
                            >
                              {v}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs text-muted-foreground">
                        Social platforms
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {student.studentProfile.assessment.socialMediaPlatforms.map(
                          (v) => (
                            <span
                              key={v}
                              className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-800 dark:bg-purple-950/60 dark:text-purple-400"
                            >
                              {v}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-8 text-center text-muted-foreground">
                  No assessment recorded.
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
