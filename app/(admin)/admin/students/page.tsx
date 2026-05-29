import { PageHeader } from "@/components/admin/shared/PageHeader";
import {
  StudentsTable,
  type StudentTableRow,
} from "@/components/admin/students/StudentsTable";
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
  schedule: string | null;
  days: string | null;
  classType: string | null;
  course: { title: string };
  payments: { status: string }[];
};

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const students = (await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: {
      studentProfile: {
        include: {
          enrollments: {
            include: {
              course: true,
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

    return {
      id: student.id,
      studentCode: student.studentProfile?.studentCode ?? "-",
      fullName: `${student.firstName} ${student.lastName}`,
      phone: student.phone ?? "-",
      course: latestActiveEnrollment?.course.title ?? "-",
      schedule: latestActiveEnrollment?.schedule ?? "-",
      days: latestActiveEnrollment?.days ?? "-",
      classType: latestActiveEnrollment?.classType ?? null,
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
