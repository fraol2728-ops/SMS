export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { TeacherReportForm } from "@/components/teacher/reports/TeacherReportForm";
import { requireTeacher } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function TeacherReportsPage() {
  await requireTeacher();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const teacher = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      teacherProfile: {
        include: {
          classes: {
            where: { isActive: true, status: "STARTED" },
            include: {
              course: true,
              enrollments: {
                where: { status: "ACTIVE" },
                include: {
                  student: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      sentReports: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          receiver: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
  });

  if (!teacher?.teacherProfile) redirect("/unauthorized");

  const allStudents = teacher.teacherProfile.classes.flatMap((c: any) =>
    c.enrollments.map((e: any) => ({
      id: e.student.user.id,
      name: `${e.student.user.firstName} ${e.student.user.lastName}`,
      course: c.course.title,
      code: e.student.studentCode,
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-gray-900 dark:text-white">
          Reports
        </h1>
        <p className="mt-1 text-gray-500">Send reports to admin</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TeacherReportForm students={allStudents} />

        <div className="rounded-xl border bg-white p-4 sm:p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 className="mb-5 font-semibold text-gray-900 dark:text-white">
            Sent Reports ({teacher.sentReports.length})
          </h2>
          {teacher.sentReports.length === 0 ? (
            <p className="py-8 text-center text-gray-400 text-sm">
              No reports sent yet
            </p>
          ) : (
            <div className="space-y-3">
              {teacher.sentReports.map((report: any) => (
                <div
                  key={report.id}
                  className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {report.title}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        report.status === "REPLIED"
                          ? "bg-green-50 text-green-700"
                          : report.status === "READ"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs">
                    To: {report.receiver.firstName} {report.receiver.lastName} •{" "}
                    {new Date(report.createdAt).toLocaleDateString("en-GB")}
                  </p>
                  {report.replyContent && (
                    <div className="mt-2 border-gray-200 border-t dark:border-gray-700 pt-2">
                      <p className="font-medium text-gray-500 text-xs">
                        Reply:
                      </p>
                      <p className="mt-0.5 text-gray-600 text-xs">
                        {report.replyContent}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
