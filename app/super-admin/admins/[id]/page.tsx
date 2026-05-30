export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function AdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await prisma.user.findFirst({
    where: { id, role: "ADMIN" },
    include: { campus: true },
  });
  if (!admin) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${admin.firstName} ${admin.lastName}`}
        description="Campus admin"
      />
      <div className="rounded-xl border bg-white p-6 text-sm">
        <p>
          <span className="font-medium">Email:</span> {admin.email}
        </p>
        <p>
          <span className="font-medium">Phone:</span> {admin.phone ?? "-"}
        </p>
        <p>
          <span className="font-medium">Campus:</span>{" "}
          {admin.campus?.name ?? "Unassigned"}
        </p>
      </div>
    </div>
  );
}
