export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminWaitlistPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { campusId } = (await searchParams) ?? {};

  const waitlist = await prisma.teacherWaitlist.findMany({
    where: { status: "PENDING" },
    orderBy: { appliedDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Waiting List"
        action={{
          label: "Add to Waitlist",
          href: `/super-admin/waitlist/new?campusId=${campusId ?? ""}`,
        }}
      />

      {waitlist.length === 0 ? (
        <div className="rounded-2xl border bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
          <p className="mb-3 text-4xl">📋</p>
          <p className="font-semibold dark:text-white">
            No one on the waiting list
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {waitlist.map((entry) => (
            <Link
              key={entry.id}
              href={`/super-admin/waitlist/${entry.id}?campusId=${campusId ?? ""}`}
            >
              <div className="rounded-xl border bg-white p-5 transition-all hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-900/30">
                      {entry.firstName[0]}
                      {entry.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold dark:text-white">
                        {entry.firstName} {entry.lastName}
                      </p>
                      <p className="text-gray-500 text-sm dark:text-gray-400">
                        📱 {entry.phone}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {entry.courses.map((course) => (
                          <span
                            key={course}
                            className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700 text-xs dark:bg-blue-900/30 dark:text-blue-400"
                          >
                            {course}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs">
                    {new Date(entry.appliedDate).toLocaleDateString("en-GB")}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
