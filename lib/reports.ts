import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

export type ReportType = "daily" | "weekly" | "monthly";

type ReportEnrollment = {
  student: {
    studentCode: string;
    user: {
      firstName: string;
      lastName: string;
      phone: string | null;
      email: string;
    };
  };
  class: {
    course: { title: string };
    lab: { name: string };
    timeSlot: string;
    days: string;
  } | null;
  payments: { status: string; amount: number }[];
  startDate: Date;
};

type ReportStudent = {
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string;
  createdAt: Date;
  studentProfile: {
    studentCode: string;
    enrollments: {
      class: { course: { title: string }; lab: { name: string } } | null;
    }[];
  } | null;
};

type ReportPayment = {
  amount: number;
  method: string | null;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
  user: { firstName: string; lastName: string };
  enrollment: { class: { course: { title: string } } | null } | null;
};

type ReportRemainingPayment = {
  remainingAmount: number;
  enrollment: {
    student: {
      studentCode: string;
      user: { firstName: string; lastName: string };
    };
    class: { course: { title: string } } | null;
  };
};

type ReportClass = {
  lab: { name: string };
  course: { title: string };
  teacher: { user: { firstName: string; lastName: string } };
  timeSlot: string;
  days: string;
  capacity: number;
  _count: { enrollments: number };
};

export async function generateReport(
  type: ReportType,
  campusId: string | null,
) {
  const now = new Date();
  let startDate: Date;
  let periodLabel: string;

  if (type === "daily") {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    periodLabel = now.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } else if (type === "weekly") {
    const dayOfWeek = now.getDay();
    startDate = new Date(now);
    startDate.setDate(now.getDate() - dayOfWeek);
    startDate.setHours(0, 0, 0, 0);
    periodLabel = `Week of ${startDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`;
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    periodLabel = now.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  }

  const campusFilter = campusId ? { campusId } : {};
  const userCampusFilter = campusId ? { campusId } : {};

  const [
    newStudents,
    activeEnrollments,
    payments,
    remainingPayments,
    classes,
    campus,
  ] = (await Promise.all([
    prisma.user.findMany({
      where: {
        role: "STUDENT",
        createdAt: { gte: startDate },
        ...userCampusFilter,
      },
      include: {
        studentProfile: {
          include: {
            enrollments: {
              include: {
                class: {
                  include: { course: true, lab: { select: { name: true } } },
                },
              },
              where: { status: "ACTIVE" },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.enrollment.findMany({
      where: {
        status: "ACTIVE",
        class: campusId ? { campusId } : undefined,
      },
      include: {
        student: { include: { user: true } },
        class: { include: { course: true, lab: { select: { name: true } } } },
        payments: {
          orderBy: { paidAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.payment.findMany({
      where: {
        status: "PAID",
        paidAt: { gte: startDate },
        user: campusId ? { campusId } : undefined,
      },
      include: {
        user: true,
        enrollment: {
          include: {
            class: {
              include: { course: true, lab: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.paymentRemaining.findMany({
      where: {
        status: { not: "PAID" },
        enrollment: { class: campusId ? { campusId } : undefined },
      },
      include: {
        enrollment: {
          include: {
            student: { include: { user: true } },
            class: { include: { course: true } },
          },
        },
      },
    }),
    prisma.class.findMany({
      where: {
        isActive: true,
        ...campusFilter,
      },
      include: {
        course: true,
        lab: { select: { name: true } },
        teacher: { include: { user: true } },
        _count: {
          select: { enrollments: { where: { status: "ACTIVE" } } },
        },
      },
      orderBy: [{ lab: { name: "asc" } }, { timeSlot: "asc" }],
    }),
    campusId ? prisma.campus.findUnique({ where: { id: campusId } }) : null,
  ])) as [
    ReportStudent[],
    ReportEnrollment[],
    ReportPayment[],
    ReportRemainingPayment[],
    ReportClass[],
    { name: string } | null,
  ];

  const campusName = campus?.name ?? "All Campuses";
  const wb = XLSX.utils.book_new();

  const totalRevenue = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );

  const outstandingBalance = remainingPayments.reduce(
    (sum, remaining) => sum + remaining.remainingAmount,
    0,
  );

  const summaryData = [
    ["EXCEED TRAINING CENTER"],
    [`${type.toUpperCase()} REPORT — ${periodLabel}`],
    [`Campus: ${campusName}`],
    [`Generated: ${now.toLocaleString("en-GB")}`],
    [],
    ["SUMMARY", ""],
    ["New Students Registered", newStudents.length],
    ["Total Active Enrollments", activeEnrollments.length],
    ["Total Classes", classes.length],
    ["Revenue Collected (ETB)", totalRevenue],
    ["Outstanding Balance (ETB)", outstandingBalance],
    ["Total Payment Transactions", payments.length],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1["!cols"] = [{ wch: 35 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");

  const regHeaders = [
    "Student Code",
    "First Name",
    "Last Name",
    "Phone",
    "Email",
    "Course",
    "Class",
    "Registration Date",
  ];
  const regRows = newStudents.map((s) => {
    const enrollment = s.studentProfile?.enrollments[0];
    return [
      s.studentProfile?.studentCode ?? "",
      s.firstName,
      s.lastName,
      s.phone ?? "",
      s.email.includes("@exceed.local") ? "(no email)" : s.email,
      enrollment?.class?.course?.title ?? "",
      enrollment?.class?.lab.name ?? "",
      s.createdAt.toLocaleDateString("en-GB"),
    ];
  });
  const ws2 = XLSX.utils.aoa_to_sheet([regHeaders, ...regRows]);
  ws2["!cols"] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 20 },
    { wch: 10 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "New Registrations");

  const studentHeaders = [
    "Student Code",
    "Full Name",
    "Phone",
    "Email",
    "Course",
    "Lab",
    "Time Slot",
    "Days",
    "Start Date",
    "Payment Status",
    "Amount (ETB)",
  ];
  const studentRows = activeEnrollments.map((e) => [
    e.student.studentCode,
    `${e.student.user.firstName} ${e.student.user.lastName}`,
    e.student.user.phone ?? "",
    e.student.user.email.includes("@exceed.local")
      ? "(no email)"
      : e.student.user.email,
    e.class?.course?.title ?? "",
    e.class?.lab.name ?? "",
    e.class?.timeSlot ?? "",
    e.class?.days ?? "",
    e.startDate.toLocaleDateString("en-GB"),
    e.payments[0]?.status ?? "No payment",
    e.payments[0]?.amount ?? 0,
  ]);
  const ws3 = XLSX.utils.aoa_to_sheet([studentHeaders, ...studentRows]);
  ws3["!cols"] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 15 },
    { wch: 25 },
    { wch: 20 },
    { wch: 8 },
    { wch: 18 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, "Active Students");

  const paymentHeaders = [
    "Student Name",
    "Student Code",
    "Course",
    "Amount (ETB)",
    "Method",
    "Status",
    "Date",
  ];
  const paymentRows = payments.map((p) => [
    `${p.user.firstName} ${p.user.lastName}`,
    "",
    p.enrollment?.class?.course?.title ?? "",
    p.amount,
    p.method ?? "",
    p.status,
    (p.paidAt ?? p.createdAt).toLocaleDateString("en-GB"),
  ]);
  const ws4 = XLSX.utils.aoa_to_sheet([paymentHeaders, ...paymentRows]);
  ws4["!cols"] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 20 },
    { wch: 12 },
    { wch: 15 },
    { wch: 10 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws4, "Payments");

  const classHeaders = [
    "Lab",
    "Course",
    "Teacher",
    "Time Slot",
    "Days",
    "Enrolled",
    "Capacity",
    "Spots Left",
    "Fill Rate",
  ];
  const classRows = classes.map((c) => {
    const enrolled = c._count.enrollments;
    const fillRate = Math.round((enrolled / c.capacity) * 100);
    return [
      c.lab.name,
      c.course.title,
      `${c.teacher.user.firstName} ${c.teacher.user.lastName}`,
      c.timeSlot,
      c.days,
      enrolled,
      c.capacity,
      c.capacity - enrolled,
      `${fillRate}%`,
    ];
  });
  const ws5 = XLSX.utils.aoa_to_sheet([classHeaders, ...classRows]);
  ws5["!cols"] = [
    { wch: 8 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
  ];
  XLSX.utils.book_append_sheet(wb, ws5, "Classes Overview");

  if (type === "weekly") {
    const tasks = await prisma.task.findMany({
      where: {
        campusId: campusId ?? undefined,
        createdAt: { gte: startDate },
      },
      include: {
        assignee: { select: { firstName: true, lastName: true, role: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });
    const taskHeaders = [
      "Title",
      "Priority",
      "Assigned To",
      "Role",
      "Status",
      "Due Date",
      "Completed",
      "Note",
    ];
    const taskRows = tasks.map((t) => [
      t.title,
      t.priority,
      t.assignee
        ? `${t.assignee.firstName} ${t.assignee.lastName}`
        : "Unassigned",
      t.assignee?.role ?? "",
      t.status,
      t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-GB") : "",
      t.completedAt ? new Date(t.completedAt).toLocaleDateString("en-GB") : "",
      t.completedNote ?? "",
    ]);
    const taskSheet = XLSX.utils.aoa_to_sheet([taskHeaders, ...taskRows]);
    XLSX.utils.book_append_sheet(wb, taskSheet, "Tasks");
  }

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return {
    buffer,
    filename: `exceed-${type}-report-${now.toISOString().slice(0, 10)}.xlsx`,
    periodLabel,
    summary: {
      newStudents: newStudents.length,
      activeEnrollments: activeEnrollments.length,
      totalRevenue,
      outstandingBalance,
      totalPayments: payments.length,
      totalClasses: classes.length,
    },
  };
}
