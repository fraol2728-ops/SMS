import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/campus";
import { generateReport, type ReportType } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getCurrentUser();
    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") ?? "daily") as ReportType;

    if (!["daily", "weekly", "monthly"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid report type" },
        { status: 400 },
      );
    }

    const campusId = user.role === "SUPER_ADMIN" ? null : user.campusId;
    const report = await generateReport(type, campusId);

    return new NextResponse(new Uint8Array(report.buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${report.filename}"`,
      },
    });
  } catch (_error) {
    // Debug logging intentionally suppressed.
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 },
    );
  }
}
