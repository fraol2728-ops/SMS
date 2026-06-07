export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { EventCard } from "@/components/shared/EventCard";
import { prisma } from "@/lib/prisma";

export default async function TeacherEventsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const teacher = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, campusId: true },
  });
  if (!teacher) redirect("/sign-in");

  const events = await prisma.event.findMany({
    where: {
      isActive: true,
      campusId: teacher.campusId ?? undefined,
      OR: [{ targetAll: true }],
    },
    include: {
      campus: { select: { name: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { date: "asc" },
  });

  const upcoming = events.filter((event) => new Date(event.date) >= new Date());
  const past = events.filter((event) => new Date(event.date) < new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-gray-900 dark:text-white">
          Events
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Campus events and announcements
        </p>
      </div>

      {upcoming.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-700 dark:text-gray-300">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Upcoming ({upcoming.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-500 dark:text-gray-400">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            Past Events ({past.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {past.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="rounded-3xl border border-dashed bg-white p-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-3 text-4xl">📅</p>
          <p className="font-semibold text-gray-400">No events yet</p>
          <p className="mt-1 text-gray-300 text-sm">
            Campus events will appear here when created by admin.
          </p>
        </div>
      )}
    </div>
  );
}
