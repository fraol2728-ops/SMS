import { NextResponse } from "next/server";
import { sendOverdueNotification } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// This route is called by Vercel Cron daily at 8am.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const campuses = await prisma.campus.findMany({
      include: {
        users: {
          where: { role: "ADMIN" },
          select: {
            firstName: true,
            lastName: true,
            email: true,
            campusId: true,
          },
        },
      },
    });

    for (const campus of campuses) {
      const [overdueCount, dueSoonCount] = await Promise.all([
        prisma.paymentRemaining.count({
          where: {
            status: { not: "PAID" },
            dueDate: { lt: today },
            enrollment: {
              status: "ACTIVE",
              class: { campusId: campus.id },
            },
          },
        }),
        prisma.paymentRemaining.count({
          where: {
            status: { not: "PAID" },
            dueDate: { gte: today, lte: sevenDaysFromNow },
            enrollment: {
              status: "ACTIVE",
              class: { campusId: campus.id },
            },
          },
        }),
      ]);

      for (const admin of campus.users) {
        if (overdueCount > 0 || dueSoonCount > 0) {
          await sendOverdueNotification(
            admin.email,
            admin.firstName,
            overdueCount,
            dueSoonCount,
            campus.name,
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment notifications sent",
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
