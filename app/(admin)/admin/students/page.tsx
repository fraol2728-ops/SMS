import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import {
  StudentsTable,
  type StudentTableRow,
} from "@/components/admin/students/StudentsTable";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

type StudentRecord = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  studentProfile: {
    studentCode: string;
    enrollments: EnrollmentRecord[];
  } | null;
};

type EnrollmentRecord = {
  status: string;
  class: {
    lab: { name: string };
    timeSlot: string;
    days: string;
    course: { title: string };
  } | null;
  payments: { status: string }[];
};

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const students = (await prisma.user.findMany({
    where: { role: "STUDENT", ...(campusId ? { campusId } : {}) },
    include: {
      studentProfile: {
        include: {
          enrollments: {
            include: {
              class: {
                include: { course: true, lab: { select: { name: true } } },
              },
              payments: { orderBy: { createdAt: "desc" }, take: 1 },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })) as StudentRecord[];

  const rows: StudentTableRow[] = students.map((student) => {
    const enrollments = student.studentProfile?.enrollments ?? [];
    const latestActiveEnrollment = enrollments.find(
      (enrollment) => enrollment.status === "ACTIVE",
    );
    const latestPayment = latestActiveEnrollment?.payments[0];
    const classRecord = latestActiveEnrollment?.class;

    return {
      id: student.id,
      studentCode: student.studentProfile?.studentCode ?? "-",
      fullName: `${student.firstName} ${student.lastName}`,
      phone: student.phone ?? "-",
      lab: classRecord?.lab?.name ?? "-",
      course: classRecord?.course.title ?? "-",
      time: classRecord
        ? TIME_SLOTS[classRecord.timeSlot as keyof typeof TIME_SLOTS]
        : "-",
      days: classRecord
        ? CLASS_DAYS[classRecord.days as keyof typeof CLASS_DAYS]
        : "-",
      paymentStatus: latestPayment?.status ?? "PENDING",
    };
  });

  return (
    <div>
      <PageHeader
        title="Students"
        action={{ label: "Add student", href: "/admin/students/new" }}
      />
      <div className="space-y-2 md:hidden">
        {students.map((student) => {
          const enrollments = student.studentProfile?.enrollments ?? [];
          const activeEnrollment = enrollments.find(
            (enrollment) => enrollment.status === "ACTIVE",
          );
          return (
            <Link key={student.id} href={`/admin/students/${student.id}`}>
              <div className="flex items-center justify-between rounded-xl border bg-white p-4 transition-all hover:border-blue-300 active:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:active:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {student.firstName[0]}
                    {student.lastName[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {student.studentProfile?.studentCode ?? "-"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {activeEnrollment?.class?.course?.title ?? "No class"}
                  </span>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    ›
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <StudentsTable className="hidden md:block" students={rows} />
    </div>
  );
}
