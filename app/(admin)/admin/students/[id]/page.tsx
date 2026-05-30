import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dropEnrollmentFormAction } from "@/lib/actions/admin";
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
  class: {
    labName: string;
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
              class: { include: { course: true } },
              attendance: { include: { class: true } },
              payments: true,
            },
          },
        },
      },
    },
  });
  if (!student) notFound();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between">
            <div>
              <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-xl font-bold">
                {student.firstName[0]}
                {student.lastName[0]}
              </div>
              <h2 className="text-2xl font-semibold">
                {student.firstName} {student.lastName}
              </h2>
              <p>{student.studentProfile?.studentCode}</p>
              <p>{student.email}</p>
              <p>{student.phone}</p>
              <p>{student.gender}</p>
              <p>{student.address}</p>
            </div>
            <div>
              <p>Guardian: {student.studentProfile?.guardianName ?? "-"}</p>
              <p>Phone: {student.studentProfile?.guardianPhone ?? "-"}</p>
              <p>
                Emergency: {student.studentProfile?.emergencyContact ?? "-"}
              </p>
            </div>
            <Button asChild>
              <Link href={`/admin/students/${student.id}/edit`}>Edit</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="enrollments">
        <TabsList>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        <TabsContent value="enrollments">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Class</th>
                <th>Course</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {student.studentProfile?.enrollments.map(
                (enrollment: EnrollmentRecord) => {
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
                    <tr key={enrollment.id}>
                      <td>
                        {classRecord
                          ? `${classRecord.labName} • ${timeLabel} • ${daysLabel}`
                          : "-"}
                      </td>
                      <td>{classRecord?.course.title ?? "-"}</td>
                      <td>{enrollment.startDate.toLocaleDateString()}</td>
                      <td>{enrollment.endDate?.toLocaleDateString() ?? "-"}</td>
                      <td>
                        <StatusBadge status={enrollment.status} />
                      </td>
                      <td>
                        <form
                          action={dropEnrollmentFormAction.bind(
                            null,
                            enrollment.id,
                          )}
                        >
                          <Button size="sm" variant="outline">
                            Drop
                          </Button>
                        </form>
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </TabsContent>
        <TabsContent value="attendance" className="space-y-4">
          {student.studentProfile?.enrollments.map(
            (enrollment: EnrollmentRecord) => {
              const total = enrollment.attendance.length;
              const present = enrollment.attendance.filter(
                (attendance: AttendanceRecord) =>
                  attendance.status === "PRESENT",
              ).length;
              const pct = total ? Math.round((present / total) * 100) : 0;
              return (
                <Card key={enrollment.id}>
                  <CardContent className="p-4 space-y-2">
                    <h4 className="font-semibold">
                      {enrollment.class?.course.title ?? "Class"}
                    </h4>
                    <Progress value={pct} />
                    <p>{pct}%</p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Status</th>
                          <th>Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollment.attendance.map(
                          (attendance: AttendanceRecord) => (
                            <tr key={attendance.id}>
                              <td>{attendance.date.toLocaleDateString()}</td>
                              <td>
                                <StatusBadge status={attendance.status} />
                              </td>
                              <td>{attendance.note ?? "-"}</td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              );
            },
          )}
        </TabsContent>
        <TabsContent value="payments">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {student.studentProfile?.enrollments
                .flatMap((enrollment: EnrollmentRecord) => enrollment.payments)
                .map((payment: PaymentRecord) => (
                  <tr key={payment.id}>
                    <td>ETB {payment.amount.toLocaleString()}</td>
                    <td>{payment.method}</td>
                    <td>
                      <StatusBadge status={payment.status} />
                    </td>
                    <td>{payment.createdAt.toLocaleDateString()}</td>
                    <td>
                      {payment.receiptUrl ? (
                        <a
                          href={payment.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
