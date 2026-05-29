import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { DataTable } from "@/components/admin/shared/DataTable";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;
  const { userId } = await auth();
  if (!userId) return null;
  const adminUser = await prisma.user.findUnique({
    where: { clerkId: userId },
  });
  if (!adminUser) return null;
  const reports = await prisma.report.findMany({
    where: { receiverId: adminUser.id },
    include: { sender: true },
    orderBy: { createdAt: "desc" },
  });
  const filtered = reports.filter(
    (r: any) => filter === "all" || r.status === filter.toUpperCase(),
  );
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" />
      <div className="flex gap-3 text-sm">
        <Link href="?filter=all">All</Link>
        <Link href="?filter=unread">Unread</Link>
        <Link href="?filter=read">Read</Link>
        <Link href="?filter=replied">Replied</Link>
      </div>
      <DataTable
        data={filtered}
        columns={[
          {
            key: "sender",
            label: "Sender",
            render: (r) => `${r.sender.firstName} ${r.sender.lastName}`,
          },
          { key: "title", label: "Title" },
          {
            key: "status",
            label: "Status",
            render: (r) => <StatusBadge status={r.status} />,
          },
          {
            key: "createdAt",
            label: "Date",
            render: (r) => r.createdAt.toLocaleDateString(),
          },
          {
            key: "view",
            label: "View",
            render: (r) => <Link href={`/admin/reports/${r.id}`}>View</Link>,
          },
        ]}
      />
    </div>
  );
}
