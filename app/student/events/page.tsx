export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { EventCard } from "@/components/shared/EventCard";
import { prisma } from "@/lib/prisma";

export default async function StudentEventsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const student = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      studentProfile: {
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            select: { classId: true },
          },
        },
      },
    },
  });
  if (!student) redirect("/sign-in");

  const enrolledClassIds =
    student.studentProfile?.enrollments.flatMap((enrollment) =>
      enrollment.classId ? [enrollment.classId] : [],
    ) ?? [];

  const events = await prisma.event.findMany({
    where: {
      isActive: true,
      campusId: student.campusId ?? undefined,
      OR: [
        { targetAll: true },
        { targetAll: false, targetClassIds: { hasSome: enrolledClassIds } },
      ],
    },
    include: {
      campus: { select: { name: true } },
      createdBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { date: "asc" },
  });

  const upcoming = events.filter((event) => new Date(event.date) >= new Date());
  const past = events.filter((event) => new Date(event.date) < new Date());
  const today = events.filter(
    (event) =>
      new Date(event.date).toDateString() === new Date().toDateString(),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-black text-2xl text-gray-900">Events</h1>
        <p className="mt-1 text-gray-500">Campus events and activities</p>
      </div>

      {today.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-r from-green-500 to-teal-500 p-5 text-white">
          <p className="mb-1 font-semibold text-sm opacity-80">TODAY</p>
          <h2 className="mb-1 font-black text-xl">{today[0].title}</h2>
          <p className="text-sm opacity-80">{today[0].time}</p>
          {today[0].location && (
            <p className="text-sm opacity-80">📍 {today[0].location}</p>
          )}
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-bold text-gray-700">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Upcoming Events ({upcoming.length})
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
          <h2 className="mb-3 flex items-center gap-2 font-bold text-gray-500">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
            Past Events
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {past.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-16 text-center">
          <p className="mb-3 text-4xl">📅</p>
          <p className="font-bold text-gray-400">No events yet</p>
          <p className="mt-1 text-gray-300 text-sm">
            Events from your campus will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
