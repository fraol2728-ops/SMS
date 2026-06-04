export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { MaterialsManager } from "@/components/teacher/materials/MaterialsManager";
import { prisma } from "@/lib/prisma";

export default async function TeacherMaterialsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const teacher = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      teacherProfile: {
        include: {
          classes: {
            where: { isActive: true, status: "STARTED" },
            include: {
              course: true,
              lab: true,
              materials: {
                include: {
                  uploadedBy: { select: { firstName: true, lastName: true } },
                },
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      },
    },
  });

  if (!teacher?.teacherProfile) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Materials
        </h1>
        <p className="text-gray-500 mt-1">Upload resources for your students</p>
      </div>
      <MaterialsManager
        classes={teacher.teacherProfile.classes}
        teacherId={teacher.id}
      />
    </div>
  );
}
