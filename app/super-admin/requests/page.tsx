export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { RequestsClient } from "@/components/admin/requests/RequestsClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { campusId } = (await searchParams) ?? {};

  const requests = await prisma.courseRequest.findMany({
    where: campusId ? { campusId } : {},
    orderBy: { createdAt: "desc" },
  });

  const query = campusId ? `?campusId=${campusId}` : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Requests"
        action={{
          label: "Add Request",
          href: `/super-admin/requests/new${query}`,
        }}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total", value: requests.length },
          {
            label: "Pending",
            value: requests.filter((r) => r.status === "PENDING").length,
          },
          {
            label: "Contacted",
            value: requests.filter((r) => r.status === "CONTACTED").length,
          },
          {
            label: "Enrolled",
            value: requests.filter((r) => r.status === "ENROLLED").length,
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
          >
            <p className="font-bold text-2xl dark:text-white">{value}</p>
            <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      <RequestsClient requests={requests} basePath="/super-admin/requests" />
    </div>
  );
}
