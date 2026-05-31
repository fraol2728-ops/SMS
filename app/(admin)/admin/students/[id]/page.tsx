import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { ChangeClassModal } from "@/components/admin/students/ChangeClassModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dropEnrollmentFormAction } from "@/lib/actions/admin";
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
    lab: { name: string };
    timeSlot: string;
    days: string;
    course: { title: string };
  } | null;
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
};

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await prisma.user.findUnique({
    where: { id },
    include: {
      studentProfile: {
        include: {
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
  const attendanceRecords = enrollments.flatMap((enrollment) => enrollment.attendance);
  const presentCount = attendanceRecords.filter((record) => record.status === "PRESENT").length;
  const attendanceRate = attendanceRecords.length
    ? Math.round((presentCount / attendanceRecords.length) * 100)
    : 0;
  const recentAttendance = [...attendanceRecords]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-7);
  const paymentRecords = enrollments.flatMap((enrollment) => enrollment.payments);
  const totalPaid = paymentRecords
    .filter((payment) => payment.status === "PAID")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const outstandingPayments = paymentRecords.filter((payment) => payment.status !== "PAID").length;
  const activeEnrollments = enrollments.filter((enrollment) => enrollment.status === "ACTIVE").length;

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-600 text-2xl font-semibold text-white shadow-lg">
                  {student.firstName[0]}
                  {student.lastName[0]}
                </div>
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight truncate">
                      {student.firstName} {student.lastName}
                    </h1>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
                      {student.gender ?? "Student"}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-900">ID:</span> {student.studentProfile?.studentCode ?? "N/A"}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Phone:</span> {student.phone ?? "N/A"}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Email:</span> {student.email}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Address:</span> {student.address ?? "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Guardian</p>
                    <p className="text-sm font-semibold text-slate-700">{student.studentProfile?.guardianName ?? "-"}</p>
                    <p className="text-sm text-slate-500">{student.studentProfile?.guardianPhone ?? "No phone listed"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Emergency contact</p>
                    <p className="text-sm font-semibold text-slate-700">{student.studentProfile?.emergencyContact ?? "Not set"}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Attendance performance</p>
                      <p className="text-sm font-semibold text-slate-900">{attendanceRate}% present</p>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-700">
                      Last {recentAttendance.length} sessions
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-7 gap-2">
                    {recentAttendance.length ? (
                      recentAttendance.map((record, index) => (
                        <div key={`${record.id}-${index}`} className="flex flex-col items-center gap-2">
                          <div
                            className={`h-12 w-full rounded-xl ${record.status === "PRESENT" ? "bg-emerald-500" : "bg-slate-300"}`}
                            style={{ minHeight: 36 }}
                          />
                          <span className="text-[10px] text-slate-500">{record.date.toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-7 rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
                        No attendance history yet.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <Button asChild className="w-full">
                    <Link href={`/admin/students/${student.id}/edit`}>Edit student</Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border border-slate-200 bg-slate-50">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Active enrollments</p>
              <p className="text-3xl font-semibold text-slate-900">{activeEnrollments}</p>
              <p className="text-sm text-slate-600">Classes currently in progress</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 bg-slate-50">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Attendance rate</p>
              <p className="text-3xl font-semibold text-slate-900">{attendanceRate}%</p>
              <p className="text-sm text-slate-600">Based on recorded sessions</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 bg-slate-50">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Payments paid</p>
              <p className="text-3xl font-semibold text-slate-900">ETB {totalPaid.toLocaleString()}</p>
              <p className="text-sm text-slate-600">Confirmed payments received</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 bg-slate-50">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Outstanding payments</p>
              <p className="text-3xl font-semibold text-slate-900">{outstandingPayments}</p>
              <p className="text-sm text-slate-600">Payments awaiting completion</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="overflow-hidden">
        <Tabs defaultValue="enrollments">
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Student activity</h2>
                <p className="text-sm text-slate-600">Review enrollments, attendance, and payment history.</p>
              </div>
              <TabsList className="grid w-full grid-cols-3 rounded-full bg-slate-100 p-1 sm:w-auto">
                <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="enrollments" className="space-y-4">
              {enrollments.length ? (
                enrollments.map((enrollment: EnrollmentRecord) => {
                  const classRecord = enrollment.class;
                  const timeLabel = classRecord
                    ? TIME_SLOTS[classRecord.timeSlot as keyof typeof TIME_SLOTS]
                    : "-";
                  const daysLabel = classRecord
                    ? CLASS_DAYS[classRecord.days as keyof typeof CLASS_DAYS]
                    : "-";

                  return (
                    <Card key={enrollment.id} className="border-slate-200">
                      <CardContent className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="rounded-full bg-slate-100 px-3 py-1">{enrollment.status}</span>
                          </div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {classRecord ? `${classRecord.course.title}` : "No class assigned"}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {classRecord ? `${classRecord.lab.name} · ${timeLabel} · ${daysLabel}` : "Class details unavailable"}
                          </p>
                          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                            <span>Start {enrollment.startDate.toLocaleDateString()}</span>
                            <span>End {enrollment.endDate?.toLocaleDateString() ?? "Ongoing"}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-start gap-3 sm:items-end">
                          <StatusBadge status={enrollment.status} />
                          <div className="flex flex-wrap gap-2">
                            {enrollment.status === "ACTIVE" ? (
                              <ChangeClassModal
                                enrollmentId={enrollment.id}
                                currentClassId={enrollment.classId ?? ""}
                                studentName={`${student.firstName} ${student.lastName}`}
                                availableClasses={availableClasses}
                              />
                            ) : null}
                            <form action={dropEnrollmentFormAction.bind(null, enrollment.id)}>
                              <Button size="sm" variant="outline">
                                Drop
                              </Button>
                            </form>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                  No enrollments found for this student.
                </div>
              )}
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4">
              {enrollments.length ? (
                enrollments.map((enrollment: EnrollmentRecord) => {
                  const total = enrollment.attendance.length;
                  const present = enrollment.attendance.filter(
                    (attendance: AttendanceRecord) => attendance.status === "PRESENT",
                  ).length;
                  const pct = total ? Math.round((present / total) * 100) : 0;

                  return (
                    <Card key={enrollment.id} className="border-slate-200">
                      <CardContent className="space-y-4 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                              {enrollment.class?.course.title ?? "Attendance"}
                            </h3>
                            <p className="text-sm text-slate-500">Attendance summary for this class</p>
                          </div>
                          <div className="rounded-3xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900">
                            {pct}% present
                          </div>
                        </div>
                        <Progress value={pct} />
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                              <tr>
                                <th className="px-3 py-2">Date</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Note</th>
                              </tr>
                            </thead>
                            <tbody>
                              {enrollment.attendance.map((attendance: AttendanceRecord) => (
                                <tr key={attendance.id} className="border-b border-slate-100">
                                  <td className="px-3 py-3">{attendance.date.toLocaleDateString()}</td>
                                  <td className="px-3 py-3">
                                    <StatusBadge status={attendance.status} />
                                  </td>
                                  <td className="px-3 py-3 text-slate-600">{attendance.note ?? "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                  No attendance records available yet.
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              {paymentRecords.length ? (
                paymentRecords.map((payment: PaymentRecord) => (
                  <Card key={payment.id} className="border-slate-200">
                    <CardContent className="grid gap-4 md:grid-cols-[1.4fr_0.6fr] md:items-center">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">ETB {payment.amount.toLocaleString()}</p>
                        <p className="text-sm text-slate-500">{payment.method ?? "Payment method not specified"}</p>
                        <p className="text-sm text-slate-500">{payment.createdAt.toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-col items-start gap-3 sm:items-end">
                        <StatusBadge status={payment.status} />
                        {payment.receiptUrl ? (
                          <a
                            href={payment.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-slate-900 hover:text-slate-700"
                          >
                            View receipt
                          </a>
                        ) : (
                          <span className="text-sm text-slate-500">No receipt</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
                  No payment history yet.
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
