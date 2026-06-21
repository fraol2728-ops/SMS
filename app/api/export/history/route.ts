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

    const endedClasses = await prisma.class.findMany({
      where: { status: "ENDED", campusId: user.campusId ?? undefined },
      include: {
        course: true,
        lab: true,
        teacher: { include: { user: true } },
        enrollments: {
          include: {
            student: { include: { user: true } },
            attendance: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const wb = XLSX.utils.book_new();
    endedClasses.forEach((c) => {
      const sheetName = `${c.lab?.name ?? "Online"} - ${c.course.title}`.slice(
        0,
        31,
      );
      const headers = [
        "Student Code",
        "Name",
        "Phone",
        "Attendance Rate",
        "Status",
      ];
      const rows = c.enrollments.map((e) => {
        const present = e.attendance.filter(
          (a) => a.status === "PRESENT",
        ).length;
        const total = e.attendance.length;
        const rate =
          total > 0 ? `${Math.round((present / total) * 100)}%` : "0%";
        return [
          e.student.studentCode,
          `${e.student.user.firstName} ${e.student.user.lastName}`,
          e.student.user.phone ?? "",
          rate,
          e.status,
        ];
      });
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([headers, ...rows]),
        sheetName,
      );
    });

    if (endedClasses.length === 0) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.aoa_to_sheet([["No ended classes yet"]]),
        "History",
      );
    }

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="exceed-history-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (_error) {
    // Debug logging intentionally suppressed.
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
