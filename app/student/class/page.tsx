export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import {
  BookOpen,
  Building2,
  Calendar,
  Clock,
  Phone,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth-check";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function StudentClassPage() {
  await requireStudent();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const student = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!student) redirect("/sign-in");

  const enrollment = await prisma.enrollment.findFirst({
    where: { student: { userId: student.id }, status: "ACTIVE" },
    include: {
      class: {
        include: {
          course: true,
          lab: { include: { campus: true } },
          teacher: { include: { user: true } },
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      phone: true,
                      gender: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!enrollment?.class) {
    return (
      <div className="py-20 text-center">
        <BookOpen size={48} className="mx-auto mb-4 text-gray-200" />
        <h2 className="text-xl font-bold text-gray-400">No active class</h2>
        <p className="mt-2 text-gray-300">
          You are not enrolled in any class yet.
        </p>
      </div>
    );
  }

  const c = enrollment.class;
  const timeLabel = TIME_SLOTS[c.timeSlot as keyof typeof TIME_SLOTS];
  const daysLabel = CLASS_DAYS[c.days as keyof typeof CLASS_DAYS];
  const today = new Date();
  const totalDays =
    c.startDate && c.endDate
      ? Math.ceil(
          (c.endDate.getTime() - c.startDate.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;
  const elapsedDays = c.startDate
    ? Math.max(
        0,
        Math.ceil(
          (today.getTime() - c.startDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      )
    : 0;
  const progressPercent =
    totalDays > 0
      ? Math.min(100, Math.round((elapsedDays / totalDays) * 100))
      : 0;
  const classmates = c.enrollments.filter(
    (classEnrollment) => classEnrollment.student.userId !== student.id,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">My Class</h1>
        <p className="mt-1 text-gray-500">Your current enrollment details</p>
      </div>

      <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <p className="mb-1 text-sm text-blue-100">Currently enrolled in</p>
        <h2 className="mb-4 text-2xl font-black">{c.course.title}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Building2, label: c.lab?.name ?? "Online" },
            { icon: Clock, label: timeLabel },
            { icon: Calendar, label: daysLabel },
            { icon: Users, label: `${c.enrollments.length} students` },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-2xl bg-white/15 px-3 py-2.5"
            >
              <Icon size={14} className="flex-shrink-0" />
              <span className="truncate text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {progressPercent > 0 && (
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-gray-900">Course Progress</h3>
            <span className="text-2xl font-black text-blue-600">
              {progressPercent}%
            </span>
          </div>
          <div className="mb-2 h-4 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-4 rounded-full transition-all duration-700 ${
                progressPercent >= 100
                  ? "bg-gradient-to-r from-green-400 to-green-600"
                  : progressPercent >= 60
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                    : "bg-gradient-to-r from-blue-400 to-blue-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between gap-2 text-xs text-gray-400">
            <span>
              Started:{" "}
              {c.startDate
                ? new Date(c.startDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </span>
            <span>
              Day {elapsedDays} of {totalDays}
            </span>
            <span>
              Ends:{" "}
              {c.endDate
                ? new Date(c.endDate).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-bold text-gray-900">Your Teacher</h3>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-teal-500 text-xl font-black text-white shadow-md">
            {c.teacher.user.firstName[0]}
            {c.teacher.user.lastName[0]}
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">
              {c.teacher.user.firstName} {c.teacher.user.lastName}
            </p>
            {c.teacher.specialty && (
              <p className="text-sm text-gray-500">{c.teacher.specialty}</p>
            )}
            {c.teacher.user.phone && (
              <a
                href={`tel:${c.teacher.user.phone}`}
                className="mt-2 flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-800"
              >
                <Phone size={13} /> {c.teacher.user.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-bold text-gray-900">
          Classmates ({classmates.length})
        </h3>
        {classmates.length === 0 ? (
          <p className="text-sm text-gray-400">
            No other students in this class yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {classmates.map((classEnrollment) => {
              const classmate = classEnrollment.student.user;
              return (
                <div
                  key={classEnrollment.id}
                  className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-sm font-bold text-white">
                    {classmate.firstName[0]}
                    {classmate.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {classmate.firstName} {classmate.lastName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
