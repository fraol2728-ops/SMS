import { type NextRequest, NextResponse } from "next/server";
import { getBackupData } from "@/lib/actions/backup";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  buildWorkbook,
  SHEET_CONVERTERS,
  workbookToBuffer,
} from "@/lib/backup-excel";

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
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "all";
    const requestedCampusId = searchParams.get("campusId") ?? null;
    let effectiveCampusId =
      user.role === "SUPER_ADMIN" ? requestedCampusId : null;
    if (user.role === "ADMIN") {
      effectiveCampusId = user.campusId;
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
          } catch (_error) {
            // Debug logging intentionally suppressed.
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
  } catch (_e) {
    // Debug logging intentionally suppressed.
    return NextResponse.json(
      { error: "Failed to generate backup" },
      { status: 500 },
    );
  }
}
