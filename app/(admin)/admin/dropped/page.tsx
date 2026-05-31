export const dynamic = "force-dynamic";

import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";
export default async function DroppedPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const droppedEnrollments = await prisma.enrollment.findMany({
    where: { status: "DROPPED", class: campusId ? { campusId } : undefined },
    include: {
      student: { include: { user: true } },
      class: { include: { course: true, lab: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dropped Students"
        description={`${droppedEnrollments.length} dropped student${droppedEnrollments.length !== 1 ? "s" : ""}`}
      />
      {droppedEnrollments.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="font-semibold">No dropped students</p>
        </div>
      ) : (
        <div className="space-y-3">
          {droppedEnrollments.map((e) => {
            const user = e.student.user;
            return (
              <Link key={e.id} href={`/admin/dropped/${e.id}`}>
                <div className="bg-white border border-red-100 rounded-xl p-5 hover:border-red-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {e.student.studentCode} • {e.class?.course.title}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-red-50 text-red-700 px-3 py-1 rounded-full">
                      Dropped
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
