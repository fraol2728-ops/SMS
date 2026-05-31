export const dynamic = "force-dynamic";

import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { TIME_SLOTS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
export default async function HistoryPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const endedClasses = await prisma.class.findMany({
    where: { status: "ENDED", campusId: campusId ?? undefined },
    include: {
      course: true,
      lab: true,
      teacher: { include: { user: true } },
      _count: { select: { enrollments: true } },
      enrollments: { select: { status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Class History"
        description={`${endedClasses.length} ended class${endedClasses.length !== 1 ? "es" : ""}`}
      />
      {endedClasses.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">📚</p>
          <p className="font-semibold">No ended classes yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {endedClasses.map((c) => {
            const completed = c.enrollments.filter(
              (e) => e.status === "COMPLETED",
            ).length;
            const dropped = c.enrollments.filter(
              (e) => e.status === "DROPPED",
            ).length;
            const timeLabel =
              c.classType === "ONLINE"
                ? "Online"
                : TIME_SLOTS[c.timeSlot as keyof typeof TIME_SLOTS];
            return (
              <Link key={c.id} href={`/admin/history/${c.id}`}>
                <div className="bg-white border rounded-xl p-5 hover:border-blue-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{c.course.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.classType === "ONLINE" ? "🌐 Online" : c.lab?.name} •{" "}
                        {timeLabel} • {c.teacher.user.firstName}{" "}
                        {c.teacher.user.lastName}
                      </p>
                      {c.startDate && c.endDate && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(c.startDate).toLocaleDateString("en-GB")} →{" "}
                          {new Date(c.endDate).toLocaleDateString("en-GB")}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        <span className="text-green-600 font-medium">
                          {completed} completed
                        </span>
                        {dropped > 0 && (
                          <span className="text-red-500 ml-2">
                            {dropped} dropped
                          </span>
                        )}
                      </p>
                    </div>
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
