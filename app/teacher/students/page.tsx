export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function TeacherStudentsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const teacher = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      teacherProfile: {
        include: {
          classes: {
            where: { isActive: true },
            include: {
              course: true,
              lab: true,
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
                          email: true,
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
      },
    },
  });

  if (!teacher?.teacherProfile) redirect("/unauthorized");

  const allEnrollments = teacher.teacherProfile.classes.flatMap((c: any) =>
    c.enrollments.map((e: any) => ({ ...e, class: c })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-gray-900">My Students</h1>
        <p className="mt-1 text-gray-500">
          {allEnrollments.length} students across{" "}
          {teacher.teacherProfile.classes.length} classes
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              {[
                "#",
                "Student",
                "Code",
                "Phone",
                "Class",
                "Time",
                "Days",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-medium text-gray-400 text-xs"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allEnrollments.map((e: any, index: number) => {
              const user = e.student.user;
              return (
                <tr key={e.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 text-xs">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-gray-100 px-2 py-1 font-mono text-xs">
                      {e.student.studentCode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {user.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700 text-xs">
                      {e.class.course.title}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {TIME_SLOTS[e.class.timeSlot as keyof typeof TIME_SLOTS]}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {CLASS_DAYS[e.class.days as keyof typeof CLASS_DAYS]}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/teacher/students/${user.id}`}>
                      <button
                        type="button"
                        className="font-medium text-blue-600 text-xs hover:text-blue-800"
                      >
                        View
                      </button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
