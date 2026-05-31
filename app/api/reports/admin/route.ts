import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getCurrentUser } from "@/lib/campus";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const reports = await prisma.report.findMany({
      where: { receiver: { id: user.id } },
      include: {
        sender: { select: { firstName: true, lastName: true, role: true } },
        receiver: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const wb = XLSX.utils.book_new();
    const rows = [
      ["Date", "From", "Role", "Title", "Content", "Status", "Reply"],
      ...reports.map((r) => [
        new Date(r.createdAt).toLocaleDateString("en-GB"),
        `${r.sender.firstName} ${r.sender.lastName}`,
        r.sender.role,
        r.title,
        r.content,
        r.status,
        r.replyContent ?? "",
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [
      { wch: 12 },
      { wch: 20 },
      { wch: 10 },
      { wch: 30 },
      { wch: 50 },
      { wch: 10 },
      { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Reports");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="exceed-reports-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
