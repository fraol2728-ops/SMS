import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { getBackupData } from "@/lib/actions/backup";
import {
  buildWorkbook,
  SHEET_CONVERTERS,
  workbookToBuffer,
} from "@/lib/backup-excel";
import { prisma } from "@/lib/prisma";

const ALL_TYPES = [
  "students",
  "withdrawn",
  "dropped",
  "courses",
  "classes",
  "teachers",
  "waitlist",
  "payments",
  "remaining",
  "certificates",
  "coc",
  "requests",
  "history",
  "inventory",
];

export async function GET(req: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (sessionClaims?.metadata as any)?.role;
    if (!["ADMIN", "SUPER_ADMIN"].includes(role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "all";
    const requestedCampusId = searchParams.get("campusId") ?? null;
    let effectiveCampusId = role === "SUPER_ADMIN" ? requestedCampusId : null;
    if (role === "ADMIN") {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { campusId: true },
      });
      effectiveCampusId = user?.campusId ?? null;
    }
    const date = new Date().toISOString().slice(0, 10);

    if (type === "all") {
      const sheets = await Promise.all(
        ALL_TYPES.map(async (t) => {
          try {
            const data = await getBackupData(t, effectiveCampusId);
            return {
              name: t.charAt(0).toUpperCase() + t.slice(1),
              rows: SHEET_CONVERTERS[t]?.(data as any[]) ?? [],
            };
          } catch (error) {
            console.error(`Backup sheet error (${t}):`, error);
            return { name: t, rows: [] };
          }
        }),
      );
      const buffer = workbookToBuffer(buildWorkbook(sheets));
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="exceed-full-backup-${date}.xlsx"`,
        },
      });
    }

    if (!ALL_TYPES.includes(type))
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    const data = await getBackupData(type, effectiveCampusId);
    const rows = SHEET_CONVERTERS[type]?.(data as any[]) ?? [];
    const buffer = workbookToBuffer(
      buildWorkbook([
        { name: type.charAt(0).toUpperCase() + type.slice(1), rows },
      ]),
    );
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="exceed-${type}-${date}.xlsx"`,
      },
    });
  } catch (e) {
    console.error("Backup download error:", e);
    return NextResponse.json(
      { error: "Failed to generate backup" },
      { status: 500 },
    );
  }
}
