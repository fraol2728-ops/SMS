export const dynamic = "force-dynamic";

import { BookOpen, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { PerformanceBadge } from "@/components/shared/PerformanceBadge";
import { getTeacherPerformance } from "@/lib/actions/performance";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function TeachersPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER", campusId: campusId ?? undefined },
    include: {
      teacherProfile: {
        include: {
          _count: {
            select: {
              classes: { where: { isActive: true, status: "STARTED" } },
            },
          },
        },
      },
    },
    orderBy: { firstName: "asc" },
  });

  const performances = await Promise.all(
    teachers.map((t) =>
      t.teacherProfile?.id ? getTeacherPerformance(t.teacherProfile.id) : null,
    ),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        description={`${teachers.length} teachers`}
        action={{ label: "Add Teacher", href: "/admin/teachers/new" }}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teachers.map((teacher, index) => {
          const specialties = teacher.teacherProfile?.specialties?.length
            ? teacher.teacherProfile.specialties
            : teacher.teacherProfile?.specialty
              ? [teacher.teacherProfile.specialty]
              : [];
          const cardContent = (
            <>
              <div className="absolute right-4 top-4">
                <PerformanceBadge performance={performances[index]} />
              </div>
              <div className="mb-4 flex items-center gap-4">
                {teacher.profilePhoto ? (
                  <Image
                    src={teacher.profilePhoto}
                    alt=""
                    width={56}
                    height={56}
                    unoptimized
                    className="h-14 w-14 flex-shrink-0 rounded-2xl object-cover shadow-md transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-teal-500 font-black text-white text-xl shadow-md transition-transform group-hover:scale-105">
                    {teacher.firstName[0]}
                    {teacher.lastName[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-bold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-white">
                    {teacher.firstName} {teacher.lastName}
                  </p>
                  <p className="truncate text-gray-400 text-xs">
                    {teacher.teacherProfile?.teacherCode ?? "—"}
                  </p>
                </div>
              </div>
              {specialties.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {specialties.slice(0, 3).map((specialty) => (
                    <span
                      key={specialty}
                      className="rounded-full bg-green-50 px-2.5 py-1 font-medium text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-2 flex items-center justify-between border-t pt-3 text-sm dark:border-gray-700">
                {teacher.phone ? (
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Phone size={12} />
                    {teacher.phone}
                  </span>
                ) : (
                  <span />
                )}
                <span className="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400">
                  <BookOpen size={13} />
                  {teacher.teacherProfile?._count.classes ?? 0} classes
                </span>
              </div>
              {!teacher.teacherProfile && (
                <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 font-medium text-amber-700 text-xs dark:bg-amber-900/20 dark:text-amber-400">
                  Profile not set up
                </p>
              )}
            </>
          );

          return teacher.teacherProfile ? (
            <Link
              key={teacher.id}
              href={`/admin/teachers/${teacher.teacherProfile.id}`}
              className="group relative rounded-3xl border bg-white p-5 pt-12 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-800"
            >
              {cardContent}
            </Link>
          ) : (
            <div
              key={teacher.id}
              className="group relative rounded-3xl border bg-white p-5 pt-12 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              {cardContent}
            </div>
          );
        })}
        {teachers.length === 0 && (
          <div className="rounded-3xl border bg-white py-16 text-center text-gray-400 dark:border-gray-700 dark:bg-gray-900 sm:col-span-2 lg:col-span-3">
            No teachers found.
          </div>
        )}
      </div>
    </div>
  );
}
