export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { AdminForm } from "@/components/super-admin/AdminForm";
import { prisma } from "@/lib/prisma";

export default async function EditAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const admin = await prisma.user.findFirst({
    where: { id, role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    include: { campus: true },
  });

  if (!admin) notFound();

  const campuses = await prisma.campus.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/super-admin/admins/${admin.id}`}>
          <button
            className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            type="button"
          >
            ← Back to Admin
          </button>
        </Link>
      </div>
      <PageHeader title="Edit Admin" />
      <AdminForm
        campuses={campuses}
        admin={{
          id: admin.id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          phone: admin.phone,
          campusId: admin.campusId || "",
        }}
        isEdit
      />
    </div>
  );
}
