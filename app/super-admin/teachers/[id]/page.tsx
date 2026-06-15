export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TeacherPerformanceCard } from "@/components/shared/TeacherPerformanceCard";
import { TerminateRoleButton } from "@/components/shared/TerminateRoleButton";
import { getTeacherPerformance } from "@/lib/actions/performance";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminTeacherDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ campusId?: string; tab?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const { campusId, tab } = (await searchParams) ?? {};
  const activeTab = tab ?? "overview";
  const tabs = ["Overview", "Classes", "Performance"];

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
      },
    },
  });

  if (!teacherProfile) notFound();

  const performance = await getTeacherPerformance(teacherProfile.id);
  const user = teacherProfile.user;

  return (
    <div className="max-w-3xl space-y-6">
      <Link href={`/super-admin/teachers?campusId=${campusId ?? ""}`}>
        <button
          className="flex items-center gap-2 text-gray-500 text-sm transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          type="button"
        >
          ← Back to Teachers
        </button>
      </Link>

      <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center gap-5">
          {user.profilePhoto ? (
            <Image
              src={user.profilePhoto}
              alt=""
              width={64}
              height={64}
              unoptimized
              className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-teal-500 font-bold text-2xl text-white shadow-lg">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
          )}
          <div>
            <h1 className="font-bold text-2xl dark:text-white">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {teacherProfile.teacherCode}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {(teacherProfile.specialties ?? []).map((specialty) => (
                <span
                  key={specialty}
                  className="rounded-full bg-green-50 px-2 py-0.5 text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <TerminateRoleButton
          userId={user.id}
          userName={`${user.firstName} ${user.lastName}`}
          userRole="TEACHER"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Email",
            value: user.email.includes("@exceed.local") ? "—" : user.email,
          },
          { label: "Phone", value: user.phone ?? "—" },
          { label: "Gender", value: user.gender ?? "—" },
          { label: "Campus", value: user.campus?.name ?? "—" },
          { label: "Bio", value: teacherProfile.bio ?? "—" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <p className="mb-1 text-gray-400 text-xs">{label}</p>
            <p className="font-medium text-sm dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-4 font-semibold dark:text-white">
          Classes ({teacherProfile.classes.length})
        </h2>
        {teacherProfile.classes.length === 0 ? (
          <p className="text-gray-400 text-sm">No active classes</p>
        ) : (
          <div className="space-y-3">
            {teacherProfile.classes.map((klass) => (
              <Link
                key={klass.id}
                href={`/super-admin/classes/${klass.id}?campusId=${campusId ?? ""}`}
              >
                <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
                  <div>
                    <p className="font-medium text-sm dark:text-white">
                      {klass.course.title}
                    </p>
                    <p className="mt-0.5 text-gray-400 text-xs">
                      {klass.lab?.name ?? "Online"} •{" "}
                      {TIME_SLOTS[klass.timeSlot as keyof typeof TIME_SLOTS]} •{" "}
                      {CLASS_DAYS[klass.days as keyof typeof CLASS_DAYS]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm dark:text-white">
                      {klass._count.enrollments}/{klass.capacity}
                    </p>
                    <p className="text-gray-400 text-xs">students</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="flex border-b px-6 dark:border-gray-700">
          {tabs.map((tabName) => {
            const key = tabName.toLowerCase();
            const active = activeTab === key;
            return (
              <Link
                key={tabName}
                href={`/super-admin/teachers/${teacherProfile.id}?campusId=${campusId ?? ""}&tab=${key}`}
                className={`px-4 py-3 text-sm font-bold ${active ? "border-blue-500 border-b-2 text-blue-600" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
              >
                {tabName}
              </Link>
            );
          })}
        </div>
        {activeTab === "performance" && (
          <div className="p-6">
            <TeacherPerformanceCard performance={performance} />
          </div>
        )}
      </div>
    </div>
  );
}
