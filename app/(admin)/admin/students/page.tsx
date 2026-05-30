import { PageHeader } from "@/components/admin/shared/PageHeader";
import {
  StudentsTable,
  type StudentTableRow,
} from "@/components/admin/students/StudentsTable";
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
      lab: classRecord?.lab.name ?? "-",
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
      <StudentsTable students={rows} />
    </div>
  );
}
