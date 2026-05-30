export const dynamic = "force-dynamic";

import { DataTable } from "@/components/admin/shared/DataTable";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: {
      user: { include: { campus: true } },
      enrollment: { include: { course: { include: { campus: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="All Payments" />
      <DataTable
        data={payments}
        emptyMessage="No payments yet."
        columns={[
          {
            key: "student",
            label: "Student",
            render: (r) => `${r.user.firstName} ${r.user.lastName}`,
          },
          {
            key: "campus",
            label: "Campus",
            render: (r) => r.enrollment.course.campus.name,
          },
          {
            key: "course",
            label: "Course",
            render: (r) => r.enrollment.course.title,
          },
          {
            key: "amount",
            label: "Amount",
            render: (r) => `ETB ${r.amount.toLocaleString()}`,
          },
          {
            key: "status",
            label: "Status",
            render: (r) => <StatusBadge status={r.status} />,
          },
          {
            key: "date",
            label: "Date",
            render: (r) => r.createdAt.toLocaleDateString(),
          },
        ]}
      />
    </div>
  );
}
