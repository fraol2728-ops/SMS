export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { UndropButton } from "@/components/admin/students/UndropButton";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminDroppedDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const { campusId } = (await searchParams) ?? {};

  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      student: { include: { user: true } },
      class: { include: { course: true, lab: true } },
    },
  });

  if (!enrollment || enrollment.status !== "DROPPED") notFound();

  const user = enrollment.student.user;

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={`/super-admin/dropped?campusId=${campusId ?? ""}`}>
        <button
          className="text-gray-500 text-sm hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          type="button"
        >
          ← Back
        </button>
      </Link>

      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description="Dropped student"
      />

      <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-6 grid grid-cols-2 gap-4">
          {[
            { label: "Student Code", value: enrollment.student.studentCode },
            { label: "Course", value: enrollment.class?.course.title ?? "—" },
            { label: "Lab", value: enrollment.class?.lab?.name ?? "Online" },
            { label: "Phone", value: user.phone ?? "—" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800"
            >
              <p className="mb-1 text-gray-400 text-xs">{label}</p>
              <p className="font-medium text-sm dark:text-white">{value}</p>
            </div>
          ))}
        </div>
        <UndropButton
          enrollmentId={enrollment.id}
          redirectTo={`/super-admin/dropped?campusId=${campusId ?? ""}`}
        />
      </div>
    </div>
  );
}
