export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { TeacherEditForm } from "@/components/admin/teachers/TeacherEditForm";
import { requireAdmin } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!teacherProfile) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { teacherProfile: true },
    });
    if (!user?.teacherProfile) notFound();
    redirect(`/admin/teachers/${user.teacherProfile.id}/edit`);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href={`/admin/teachers/${teacherProfile.id}`}>
        <button
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
          type="button"
        >
          ← Back to Teacher
        </button>
      </Link>
      <PageHeader title="Edit Teacher" />
      <TeacherEditForm
        teacherProfile={teacherProfile}
        user={teacherProfile.user}
      />
    </div>
  );
}
