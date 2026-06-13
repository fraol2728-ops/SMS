import Link from "next/link";
import { DataTable } from "@/components/admin/shared/DataTable";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { CLASS_DAYS, TIME_SLOTS } from "@/lib/constants";
import { prisma, withRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ClassesPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const resolvedSearchParams = await searchParams;
  const requestedStatus = resolvedSearchParams?.status;
  const status =
    requestedStatus === "REGISTRATION" || requestedStatus === "STARTED"
      ? requestedStatus
      : "STARTED";

  try {
    const [registrationCount, startedCount, classes] = await withRetry(() =>
      Promise.all([
        prisma.class.count({
          where: { ...(campusId ? { campusId } : {}), status: "REGISTRATION" },
        }),
        prisma.class.count({
          where: { ...(campusId ? { campusId } : {}), status: "STARTED" },
        }),
        prisma.class.findMany({
          where: {
            ...(campusId ? { campusId } : {}),
            status,
          },
          include: {
            course: true,
            teacher: { include: { user: true } },
            campus: true,
            lab: { select: { name: true } },
            _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
          },
          orderBy: [{ lab: { name: "asc" } }, { timeSlot: "asc" }],
        }),
      ]),
    );

    return (
      <div className="space-y-6">
        <PageHeader
          title="Classes"
          action={{ label: "Add class", href: "/admin/classes/new" }}
        />
        <div className="flex flex-wrap gap-2 rounded-xl border bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
          <Button
            asChild
            variant={status === "REGISTRATION" ? "default" : "outline"}
          >
            <Link href="/admin/classes?status=REGISTRATION">
              Registration ({registrationCount})
            </Link>
          </Button>
          <Button asChild variant={status === "STARTED" ? "default" : "outline"}>
            <Link href="/admin/classes?status=STARTED">
              Started ({startedCount})
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/history">Ended</Link>
          </Button>
        </div>
        <div className="space-y-2 md:hidden">
          {classes.map((c) => (
            <Link key={c.id} href={`/admin/classes/${c.id}`}>
              <div className="rounded-xl border bg-white p-4 transition-all hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {c.course.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {c.lab?.name ?? "Online"}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {c._count.enrollments}/{c.capacity}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {TIME_SLOTS[c.timeSlot as keyof typeof TIME_SLOTS]}
                  </span>
                  <span className="rounded-full bg-purple-50 px-2 py-1 text-xs text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    {CLASS_DAYS[c.days as keyof typeof CLASS_DAYS]}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="hidden md:block">
          <DataTable
            data={classes}
            emptyMessage="No classes yet. Create a class to start enrolling students."
            columns={[
              {
                key: "lab",
                label: "Lab",
                render: (r) => (
                  <Link
                    href={`/admin/classes/${r.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {r.lab?.name ?? "Online"}
                  </Link>
                ),
              },
              { key: "course", label: "Course", render: (r) => r.course.title },
              {
                key: "teacher",
                label: "Teacher",
                render: (r) =>
                  `${r.teacher.user.firstName} ${r.teacher.user.lastName}`,
              },
              {
                key: "timeSlot",
                label: "Time",
                render: (r) => TIME_SLOTS[r.timeSlot as keyof typeof TIME_SLOTS],
              },
              {
                key: "days",
                label: "Days",
                render: (r) => CLASS_DAYS[r.days as keyof typeof CLASS_DAYS],
              },
              {
                key: "students",
                label: "Students",
                render: (r) => `${r._count.enrollments} / ${r.capacity}`,
              },
              {
                key: "status",
                label: "Status",
                render: (r) => (
                  <Badge
                    variant={r.status === "STARTED" ? "default" : "secondary"}
                  >
                    {r.status}
                  </Badge>
                ),
              },
              {
                key: "actions",
                label: "Actions",
                render: (r) => (
                  <div className="flex flex-wrap gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/classes/${r.id}`}>View</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/classes/${r.id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>
    );
  } catch (error: any) {
    const msg = (error?.message ?? String(error)).toLowerCase();
    const isDbError =
      msg.includes("can't reach database") ||
      msg.includes('etimedout') ||
      msg.includes('connection') ||
      msg.includes('p1001') ||
      msg.includes('p1002');

    if (isDbError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-3xl flex items-center justify-center">
            <span className="text-3xl">🔌</span>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Database Waking Up
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
              The database server is starting up. This happens after periods of inactivity. Please wait a moment and refresh the page.
            </p>
          </div>
          <Link
            href="/admin/classes"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl transition-colors"
          >
            Try Again
          </Link>
        </div>
      );
    }

    throw error;
  }
}
