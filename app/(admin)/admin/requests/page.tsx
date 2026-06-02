export const dynamic = "force-dynamic";

import { RequestsClient } from "@/components/admin/requests/RequestsClient";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function RequestsPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const requests = await prisma.courseRequest.findMany({
    where: campusId ? { campusId } : {},
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Requests"
        description="Students requesting courses not yet available"
        action={{ label: "Add Request", href: "/admin/requests/new" }}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total",
            value: requests.length,
            color: "bg-blue-50 text-blue-700",
          },
          {
            label: "Pending",
            value: requests.filter((r) => r.status === "PENDING").length,
            color: "bg-amber-50 text-amber-700",
          },
          {
            label: "Contacted",
            value: requests.filter((r) => r.status === "CONTACTED").length,
            color: "bg-purple-50 text-purple-700",
          },
          {
            label: "Enrolled",
            value: requests.filter((r) => r.status === "ENROLLED").length,
            color: "bg-green-50 text-green-700",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-4 ${color.split(" ")[0]}`}>
            <p className={`text-2xl font-bold ${color.split(" ")[1]}`}>
              {value}
            </p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      <RequestsClient requests={requests} />
    </div>
  );
}
