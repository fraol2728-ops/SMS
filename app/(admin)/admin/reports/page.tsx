export const dynamic = "force-dynamic";

import Link from "next/link";
import { ReportGenerator } from "@/components/admin/reports/ReportGenerator";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const reports = await prisma.report.findMany({
    where: { receiver: campusId ? { campusId } : undefined },
    include: { sender: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const unreadCount = reports.filter((r) => r.status === "UNREAD").length;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate, review, and download reports"
      />
      <div className="flex items-center gap-3">
        <Badge variant={unreadCount > 0 ? "destructive" : "secondary"}>
          {unreadCount} unread
        </Badge>
        <Button asChild variant="outline">
          <a href="/api/reports/admin">Download Excel</a>
        </Button>
      </div>
      <div className="grid gap-3">
        {reports.map((report) => (
          <Link
            key={report.id}
            href={`/admin/reports/${report.id}`}
            className="rounded-xl border bg-white p-4 hover:border-blue-300"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{report.title}</p>
                <p className="text-sm text-muted-foreground">
                  From {report.sender.firstName} {report.sender.lastName} •{" "}
                  {new Date(report.createdAt).toLocaleDateString("en-GB")}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-gray-700">
                  {report.content}
                </p>
              </div>
              <Badge>{report.status}</Badge>
            </div>
          </Link>
        ))}
      </div>
      <ReportGenerator />
    </div>
  );
}
