export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function TeacherProfilePage() {
  await requireTeacher();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const teacher = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      teacherProfile: true,
      campus: true,
    },
  });

  if (!teacher?.teacherProfile) redirect("/unauthorized");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-gray-900">My Profile</h1>
        <p className="mt-1 text-gray-500">Your personal information</p>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <div className="mb-6 flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 font-bold text-3xl text-blue-700">
            {teacher.firstName[0]}
            {teacher.lastName[0]}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-xl">
              {teacher.firstName} {teacher.lastName}
            </h2>
            <p className="text-gray-500">
              {teacher.teacherProfile.teacherCode}
            </p>
            <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-1 text-blue-700 text-xs">
              Teacher
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Email",
              value: teacher.email.includes("@exceed.local")
                ? "—"
                : teacher.email,
            },
            { label: "Phone", value: teacher.phone ?? "—" },
            { label: "Gender", value: teacher.gender ?? "—" },
            { label: "Campus", value: teacher.campus?.name ?? "—" },
            {
              label: "Specialty",
              value: teacher.teacherProfile.specialty ?? "—",
            },
            {
              label: "Teacher Code",
              value: teacher.teacherProfile.teacherCode,
            },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-gray-50 p-4">
              <p className="mb-1 text-gray-400 text-xs">{label}</p>
              <p className="font-medium text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {teacher.teacherProfile.bio && (
          <div className="mt-4 border-t pt-4">
            <p className="mb-2 text-gray-400 text-xs">Bio</p>
            <p className="text-gray-700 text-sm">
              {teacher.teacherProfile.bio}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
