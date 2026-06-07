export const dynamic = "force-dynamic";

import { AdminEventsClient } from "@/components/admin/events/AdminEventsClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function AdminEventsPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();

  const [events, classes, campus] = await Promise.all([
    prisma.event.findMany({
      where: campusId ? { campusId } : {},
      include: {
        campus: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.class.findMany({
      where: {
        campusId: campusId ?? undefined,
        isActive: true,
        status: "STARTED",
      },
      include: {
        course: { select: { title: true } },
        lab: { select: { name: true } },
      },
      orderBy: [{ lab: { name: "asc" } }],
    }),
    campusId
      ? prisma.campus.findUnique({
          where: { id: campusId },
          select: { name: true },
        })
      : null,
  ]);

  const upcoming = events.filter((event) => new Date(event.date) >= new Date());
  const past = events.filter((event) => new Date(event.date) < new Date());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Create and manage campus events"
      />
      <AdminEventsClient
        upcoming={upcoming}
        past={past}
        classes={classes}
        campusName={campus?.name}
      />
    </div>
  );
}
