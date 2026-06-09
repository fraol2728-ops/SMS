export const dynamic = "force-dynamic";

import { BookOpen, Building2, Phone } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function TeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const campusId = await getCurrentUserCampusId();

  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { id },
    include: {
      user: { include: { campus: true } },
      classes: {
        where: { isActive: true },
        include: {
          course: true,
          lab: true,
          _count: {
            select: { enrollments: { where: { status: "ACTIVE" } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (teacherProfile && campusId && teacherProfile.user.campusId !== campusId) {
    notFound();
  }

  if (!teacherProfile) {
    const userWithProfile = await prisma.user.findFirst({
      where: { id, ...(campusId ? { campusId } : {}) },
      include: {
        teacherProfile: {
          include: {
            user: { include: { campus: true } },
            classes: {
              where: { isActive: true },
              include: {
                course: true,
                lab: true,
                _count: {
                  select: { enrollments: { where: { status: "ACTIVE" } } },
                },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });
    if (!userWithProfile?.teacherProfile) notFound();
    redirect(`/admin/teachers/${userWithProfile.teacherProfile.id}`);
  }

  const user = teacherProfile.user;
  const totalStudents = teacherProfile.classes.reduce(
    (sum, c) => sum + c._count.enrollments,
    0,
  );

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/teachers">
        <button
          type="button"
          className="mb-2 flex items-center gap-2 text-gray-500 text-sm transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          ← Back to Teachers
        </button>
      </Link>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="h-2 bg-gradient-to-r from-green-400 to-teal-500" />
        <div className="p-6">
          <div className="flex flex-col items-start gap-5 sm:flex-row">
            {user.profilePhoto ? (
              <a
                href={user.profilePhoto}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={user.profilePhoto}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-20 w-20 cursor-pointer rounded-3xl object-cover shadow-lg"
                />
              </a>
            ) : (
              <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-green-400 to-teal-500 font-black text-2xl text-white shadow-lg">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-black text-2xl text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h1>
              <p className="font-mono text-gray-500 text-sm dark:text-gray-400">
                {teacherProfile.teacherCode}
              </p>
              {(teacherProfile.specialties ?? []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(teacherProfile.specialties ?? []).map((specialty) => (
                    <span
                      key={specialty}
                      className="rounded-full bg-green-50 px-2.5 py-1 font-medium text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-gray-500 text-sm dark:text-gray-400">
                {user.phone && (
                  <a
                    href={`tel:${user.phone}`}
                    className="flex items-center gap-1.5 hover:text-green-600"
                  >
                    <Phone size={13} className="text-green-500" />
                    {user.phone}
                  </a>
                )}
                {user.campus && (
                  <span className="flex items-center gap-1.5">
                    <Building2 size={13} className="text-blue-500" />
                    {user.campus.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Active Classes",
            value: teacherProfile.classes.length,
            color:
              "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
          },
          {
            label: "Total Students",
            value: totalStudents,
            color:
              "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
          },
          {
            label: "Campus",
            value: user.campus?.name ?? "—",
            color:
              "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className={`rounded-2xl p-5 ${color.split(" ").slice(0, 2).join(" ")}`}
          >
            <p
              className={`font-black text-3xl ${color.split(" ").slice(2).join(" ")}`}
            >
              {value}
            </p>
            <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 font-bold text-gray-900 dark:text-white">
          Personal Information
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: "Email",
              value: user.email.includes("@exceed.local") ? "—" : user.email,
            },
            { label: "Phone", value: user.phone ?? "—" },
            { label: "Gender", value: user.gender ?? "—" },
            { label: "Address", value: user.address ?? "—" },
            { label: "Telegram", value: user.telegram ?? "—" },
            { label: "WhatsApp", value: user.whatsapp ?? "—" },
            { label: "Bio", value: teacherProfile.bio ?? "—" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800"
            >
              <p className="mb-1 font-semibold text-gray-400 text-xs uppercase tracking-wide">
                {label}
              </p>
              <p className="font-semibold text-gray-900 text-sm dark:text-white">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 font-bold text-gray-900 dark:text-white">
          Active Classes ({teacherProfile.classes.length})
        </h2>
        {teacherProfile.classes.length === 0 ? (
          <div className="py-8 text-center text-gray-400">
            <BookOpen size={32} className="mx-auto mb-2 opacity-20" />
            <p>No active classes assigned</p>
          </div>
        ) : (
          <div className="space-y-3">
            {teacherProfile.classes.map((c) => (
              <Link key={c.id} href={`/admin/classes/${c.id}`}>
                <div className="group flex items-center justify-between rounded-2xl bg-gray-50 p-4 transition-colors hover:bg-blue-50 dark:bg-gray-800 dark:hover:bg-blue-900/20">
                  <div>
                    <p className="font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white">
                      {c.course.title}
                    </p>
                    <p className="mt-0.5 text-gray-400 text-xs">
                      {c.lab?.name ?? "Online"} •{" "}
                      {TIME_SLOTS[c.timeSlot as keyof typeof TIME_SLOTS] ??
                        c.timeSlot}{" "}
                      •{" "}
                      {CLASS_DAYS[c.days as keyof typeof CLASS_DAYS] ?? c.days}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {c._count.enrollments}/{c.capacity}
                    </p>
                    <p className="text-gray-400 text-xs">students</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href={`/admin/teachers/${teacherProfile.id}/edit`}>
          <button
            type="button"
            className="rounded-2xl border bg-white px-5 py-2.5 font-medium text-gray-700 text-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            ✏️ Edit Teacher
          </button>
        </Link>
      </div>
    </div>
  );
}
