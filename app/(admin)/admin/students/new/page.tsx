import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StudentForm } from "@/components/admin/students/StudentForm";
import CalculatorWidget from "@/components/ui/CalculatorWidget";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma, withRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewStudentPage({
  searchParams,
}: {
  searchParams?: Promise<{
    firstName?: string;
    lastName?: string;
    phone?: string;
  }>;
}) {
  try {
    await requireAdmin();
    const campusId = await getCurrentUserCampusId();
    const params = (await searchParams) ?? {};
    const classes = await withRetry(() =>
      prisma.class.findMany({
        where: {
          campusId: campusId ?? undefined,
          isActive: true,
          status: { in: ["REGISTRATION", "STARTED"] },
        },
        include: {
          course: { select: { title: true, fee: true } },
          lab: { select: { name: true } },
          teacher: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
          _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
        },
        orderBy: [{ status: "asc" }, { lab: { name: "asc" } }, { timeSlot: "asc" }],
      }),
    );

    const formattedClasses = classes.map((classRecord) => ({
    ...classRecord,
    startDate: classRecord.startDate?.toISOString().slice(0, 10) ?? null,
    endDate: classRecord.endDate?.toISOString().slice(0, 10) ?? null,
  }));

    return (
      <div className="space-y-6">
        <PageHeader title="Register new student" />
        {classes.length === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            No active classes exist yet. Please{" "}
            <Link href="/admin/classes/new" className="font-semibold underline">
              add a class
            </Link>{" "}
            before registering a student.
          </div>
        ) : null}
        <StudentForm
          classes={formattedClasses}
          defaultPersonalValues={{
            firstName: params.firstName,
            lastName: params.lastName,
            phone: params.phone,
          }}
        />
        <CalculatorWidget />
      </div>
    )
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
            href="/admin/students/new"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl transition-colors"
          >
            Try Again
          </Link>
        </div>
      )
    }

    throw error
  }
}
