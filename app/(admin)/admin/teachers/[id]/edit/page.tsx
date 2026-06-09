import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { TeacherForm } from "@/components/admin/teachers/TeacherForm";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const campusId = await getCurrentUserCampusId();
  const teacher = await prisma.user.findFirst({
    where: { id, role: "TEACHER", ...(campusId ? { campusId } : {}) },
    include: { teacherProfile: true },
  });
  if (!teacher) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Edit teacher" />
      <TeacherForm
        defaultValues={{
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          phone: teacher.phone ?? "",
          gender: teacher.gender ?? "",
          specialty: teacher.teacherProfile?.specialty ?? "",
          specialties: teacher.teacherProfile?.specialties ?? [],
          bio: teacher.teacherProfile?.bio ?? "",
          profilePhoto: teacher.profilePhoto,
        }}
      />
    </div>
  );
}
