import { auth } from "@clerk/nextjs/server";
import { AssetCategory, AssetCondition, ClassType } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const enumValue = <T extends Record<string, string>>(
  values: T,
  value: unknown,
  fallback: T[keyof T],
) => {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  return (Object.values(values) as string[]).includes(normalized)
    ? (normalized as T[keyof T])
    : fallback;
};

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = (sessionClaims?.metadata as any)?.role;
    if (!["ADMIN", "SUPER_ADMIN"].includes(role))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;
    const requestedCampusId = formData.get("campusId") as string | null;
    if (!file || !type)
      return NextResponse.json(
        { error: "Missing file or type" },
        { status: 400 },
      );

    const wb = XLSX.read(await file.arrayBuffer(), { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);
    if (rows.length === 0)
      return NextResponse.json(
        { error: "No data found in file" },
        { status: 400 },
      );

    let effectiveCampusId = role === "SUPER_ADMIN" ? requestedCampusId : null;
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, campusId: true },
    });
    if (role === "ADMIN") effectiveCampusId = user?.campusId ?? null;
    if (!effectiveCampusId && type !== "students")
      return NextResponse.json(
        { error: "Campus is required for this import" },
        { status: 400 },
      );

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    if (type === "students") {
      for (const row of rows) {
        try {
          const studentCode = row["Student Code"]?.toString().trim();
          const firstName = row["First Name"]?.toString().trim();
          const lastName = row["Last Name"]?.toString().trim();
          if (!studentCode || !firstName || !lastName) {
            skipped++;
            errors.push(
              "Row skipped: missing Student Code, First Name, or Last Name",
            );
            continue;
          }
          const existing = await prisma.studentProfile.findUnique({
            where: { studentCode },
          });
          if (!existing) {
            skipped++;
            errors.push(
              `Student ${firstName} ${lastName}: skipped — use student registration to add new students`,
            );
            continue;
          }
          await prisma.user.update({
            where: { id: existing.userId },
            data: {
              firstName,
              lastName,
              phone: row["Phone"]?.toString().trim() || null,
              email: row["Email"]?.toString().trim() || undefined,
              address: row["Address"]?.toString().trim() || null,
              telegram: row["Telegram"]?.toString().trim() || null,
              whatsapp: row["WhatsApp"]?.toString().trim() || null,
            },
          });
          await prisma.studentProfile.update({
            where: { id: existing.id },
            data: {
              guardianName: row["Guardian Name"]?.toString().trim() || null,
              guardianPhone: row["Guardian Phone"]?.toString().trim() || null,
              notes: row["Notes"]?.toString().trim() || null,
            },
          });
          imported++;
        } catch (e) {
          skipped++;
          errors.push(
            `Row error: ${e instanceof Error ? e.message : "Unknown error"}`,
          );
        }
      }
    } else if (type === "courses") {
      for (const row of rows) {
        try {
          const title = row["Title"]?.toString().trim();
          if (!title) {
            skipped++;
            continue;
          }
          const existing = await prisma.course.findFirst({
            where: { title, campusId: effectiveCampusId! },
          });
          const baseSlug = slugify(title);
          const data = {
            title,
            slug: existing?.slug ?? `${baseSlug}-${effectiveCampusId}`,
            description: row["Description"]?.toString().trim() || null,
            classType: enumValue(
              ClassType,
              row["Class Type"],
              "GROUP" as ClassType,
            ),
            durationWeeks: Number(row["Duration (Weeks)"] ?? 8),
            fee: Number(row["Fee (ETB)"] ?? 0),
            isActive: row["Status"] !== "Inactive",
            campusId: effectiveCampusId!,
          };
          if (existing)
            await prisma.course.update({ where: { id: existing.id }, data });
          else await prisma.course.create({ data });
          imported++;
        } catch (e) {
          skipped++;
          errors.push(
            `Course row error: ${e instanceof Error ? e.message : "Unknown error"}`,
          );
        }
      }
    } else if (type === "inventory") {
      if (!user?.id)
        return NextResponse.json(
          { error: "User profile not found" },
          { status: 400 },
        );
      const lab = await prisma.lab.findFirst({
        where: { campusId: effectiveCampusId! },
        orderBy: { name: "asc" },
      });
      if (!lab)
        return NextResponse.json(
          { error: "No lab found for selected campus" },
          { status: 400 },
        );
      for (const row of rows) {
        try {
          const name = row["Name"]?.toString().trim();
          if (!name) {
            skipped++;
            continue;
          }
          const serialNumber = row["Serial Number"]?.toString().trim() || null;
          const existing = serialNumber
            ? await prisma.asset.findUnique({ where: { serialNumber } })
            : await prisma.asset.findFirst({ where: { name, labId: lab.id } });
          const data = {
            name,
            category: enumValue(
              AssetCategory,
              row["Category"],
              "OTHER" as AssetCategory,
            ),
            serialNumber,
            condition: enumValue(
              AssetCondition,
              row["Condition"],
              "GOOD" as AssetCondition,
            ),
            notes: row["Notes"]?.toString().trim() || null,
          };
          if (existing)
            await prisma.asset.update({ where: { id: existing.id }, data });
          else
            await prisma.asset.create({
              data: { ...data, labId: lab.id, addedById: user.id },
            });
          imported++;
        } catch (e) {
          skipped++;
          errors.push(
            `Inventory row error: ${e instanceof Error ? e.message : "Unknown error"}`,
          );
        }
      }
    } else {
      return NextResponse.json({
        success: false,
        error: `Import not supported for "${type}". Only students, courses, and inventory can be imported. Other data is managed through the app.`,
      });
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.slice(0, 10),
      message: `Import complete: ${imported} processed, ${skipped} skipped`,
    });
  } catch (e) {
    console.error("Import error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Import failed" },
      { status: 500 },
    );
  }
}
