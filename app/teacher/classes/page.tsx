export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { BookOpen, Clock, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth-check";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function TeacherClassesPage() {
  await requireTeacher();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const teacher = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      teacherProfile: {
        include: {
          classes: {
            where: { isActive: true, status: "STARTED" },
            include: {
              course: true,
              lab: { include: { campus: true } },
              _count: {
                select: { enrollments: { where: { status: "ACTIVE" } } },
              },
            },
            orderBy: [{ lab: { name: "asc" } }, { timeSlot: "asc" }],
          },
        },
      },
    },
  });

  if (!teacher?.teacherProfile) redirect("/unauthorized");

  const classes = teacher.teacherProfile.classes;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-gray-900">My Classes</h1>
        <p className="mt-1 text-gray-500">
          {classes.length} active class{classes.length !== 1 ? "es" : ""}
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No classes assigned yet.</p>
          <p className="mt-1 text-gray-400 text-sm">
            Contact your administrator to get assigned to a class.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {classes.map((c: any) => {
            const fillPercent = Math.round(
              c.capacity ? (c._count.enrollments / c.capacity) * 100 : 0,
            );
            return (
              <Link key={c.id} href={`/teacher/classes/${c.id}`}>
                <div className="cursor-pointer rounded-xl border bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                      <BookOpen size={22} className="text-white" />
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-blue-50 px-2 py-1 font-medium text-blue-700 text-xs">
                        {c.lab?.name ?? "Online"}
                      </span>
                      <p className="mt-1 text-gray-400 text-xs">
                        {c.lab.campus.name}
                      </p>
                    </div>
                  </div>

                  <h3 className="mb-1 font-bold text-gray-900 text-lg">
                    {c.course.title}
                  </h3>

                  <div className="mb-4 space-y-1">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Clock size={14} />
                      {TIME_SLOTS[c.timeSlot as keyof typeof TIME_SLOTS]}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Users size={14} />
                      {CLASS_DAYS[c.days as keyof typeof CLASS_DAYS]}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="text-gray-500">Students</span>
                      <span className="font-semibold">
                        {c._count.enrollments}/{c.capacity}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          fillPercent >= 100
                            ? "bg-red-500"
                            : fillPercent >= 80
                              ? "bg-amber-500"
                              : "bg-blue-500"
                        }`}
                        style={{ width: `${Math.min(100, fillPercent)}%` }}
                      />
                    </div>
                  </div>

                  {c.startDate && (
                    <p className="mt-3 text-gray-400 text-xs">
                      {new Date(c.startDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {c.endDate &&
                        ` → ${new Date(c.endDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}`}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
