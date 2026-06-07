export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminEventsClient } from "@/components/admin/events/AdminEventsClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminEventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { campusId } = (await searchParams) ?? {};

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
      <PageHeader title="Events" description="Manage campus events" />
      <AdminEventsClient
        upcoming={upcoming}
        past={past}
        classes={classes}
        campusName={campus?.name ?? "All Campuses"}
      />
    </div>
  );
}
