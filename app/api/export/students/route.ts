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

    const students = await prisma.studentProfile.findMany({
      where: user.campusId ? { user: { campusId: user.campusId } } : {},
      include: {
        user: true,
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            class: { include: { course: true, lab: true } },
            payments: { orderBy: { createdAt: "desc" }, take: 1 },
          },
          take: 1,
        },
        assessment: true,
      },
      orderBy: { studentCode: "asc" },
    });

    const wb = XLSX.utils.book_new();
    const headers = [
      "Student Code",
      "First Name",
      "Last Name",
      "Phone",
      "Email",
      "Gender",
      "Address",
      "Telegram",
      "WhatsApp",
      "Registration Date",
      "Course",
      "Lab",
      "Class Type",
      "Payment Status",
      "Amount Paid",
      "Guardian Name",
      "Guardian Phone",
    ];

    const rows = students.map((s) => {
      const enrollment = s.enrollments[0];
      return [
        s.studentCode,
        s.user.firstName,
        s.user.lastName,
        s.user.phone ?? "",
        s.user.email.includes("@exceed.local") ? "" : s.user.email,
        s.user.gender ?? "",
        s.user.address ?? "",
        s.user.telegram ?? "",
        s.user.whatsapp ?? "",
        new Date(s.registrationDate ?? s.user.createdAt).toLocaleDateString(
          "en-GB",
        ),
        enrollment?.class?.course?.title ?? "",
        enrollment?.class?.lab?.name ??
          (enrollment?.class?.classType === "ONLINE" ? "Online" : ""),
        enrollment?.class?.classType ?? "",
        enrollment?.payments[0]?.status ?? "",
        enrollment?.payments[0]?.amount ?? "",
        s.guardianName ?? "",
        s.guardianPhone ?? "",
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = headers.map(() => ({ wch: 18 }));
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="exceed-students-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
