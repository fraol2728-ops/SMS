import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentUser } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payments = await prisma.payment.findMany({
      where: user.campusId ? { user: { campusId: user.campusId } } : {},
      include: {
        user: true,
        enrollment: {
          include: {
            student: { select: { studentCode: true } },
            class: { include: { course: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const remaining = await prisma.paymentRemaining.findMany({
      where: user.campusId
        ? { enrollment: { class: { campusId: user.campusId } } }
        : {},
      include: {
        enrollment: {
          include: {
            student: { include: { user: true } },
            class: { include: { course: true } },
          },
        },
      },
    });

    const wb = XLSX.utils.book_new();
    const payHeaders = [
      "Date",
      "Student Name",
      "Student Code",
      "Course",
      "Amount (ETB)",
      "Method",
      "Status",
    ];
    const payRows = payments.map((p) => [
      new Date(p.createdAt).toLocaleDateString("en-GB"),
      `${p.user.firstName} ${p.user.lastName}`,
      p.enrollment?.student?.studentCode ?? "",
      p.enrollment?.class?.course?.title ?? "",
      p.amount,
      p.method ?? "",
      p.status,
    ]);
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([payHeaders, ...payRows]),
      "Payments",
    );

    const remHeaders = [
      "Student Name",
      "Course",
      "Original Fee",
      "Paid",
      "Remaining",
      "Due Date",
      "Status",
    ];
    const remRows = remaining.map((r) => [
      `${r.enrollment.student.user.firstName} ${r.enrollment.student.user.lastName}`,
      r.enrollment.class?.course?.title ?? "",
      r.originalFee,
      r.paidAmount,
      r.remainingAmount,
      new Date(r.dueDate).toLocaleDateString("en-GB"),
      r.status,
    ]);
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([remHeaders, ...remRows]),
      "Remaining",
    );

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="exceed-payments-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (_error) {
    // Debug logging intentionally suppressed.
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
