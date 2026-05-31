export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { UndropButton } from "@/components/admin/students/UndropButton";
import { requireAdmin } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";
export default async function DroppedDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
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
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title={`${user.firstName} ${user.lastName}`}
        description="Dropped student"
      />
      <div className="bg-white border rounded-xl p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: "Student Code", value: enrollment.student.studentCode },
            { label: "Course", value: enrollment.class?.course.title ?? "—" },
            { label: "Lab", value: enrollment.class?.lab?.name ?? "Online" },
            { label: "Phone", value: user.phone ?? "—" },
            {
              label: "Dropped On",
              value: enrollment.endDate
                ? new Date(enrollment.endDate).toLocaleDateString("en-GB")
                : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="font-medium text-sm">{value}</p>
            </div>
          ))}
        </div>
        <UndropButton enrollmentId={enrollment.id} />
      </div>
    </div>
  );
}
