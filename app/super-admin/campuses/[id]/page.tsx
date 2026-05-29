export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function CampusDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campus = await prisma.campus.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, courses: true } },
    },
  });
  if (!campus) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={campus.name}
        description={campus.location ?? undefined}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-6">
          <p className="text-sm text-muted-foreground">Users</p>
          <p className="text-3xl font-bold">{campus._count.users}</p>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <p className="text-sm text-muted-foreground">Courses</p>
          <p className="text-3xl font-bold">{campus._count.courses}</p>
        </div>
      </div>
    </div>
  );
}
