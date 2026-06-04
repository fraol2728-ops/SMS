export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { COCTable } from "@/components/admin/coc/COCTable";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminCOCPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { campusId } = (await searchParams) ?? {};

  const cocStudents = await prisma.cOCStudent.findMany({
    where: campusId ? { campusId } : {},
    include: {
      studentProfile: { include: { user: true } },
      addedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = cocStudents
    .filter((s) => s.paymentStatus === "PAID")
    .reduce((sum, s) => sum + s.paymentAmount, 0);

  const query = campusId ? `?campusId=${campusId}` : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="COC Exam Students"
        action={{ label: "Add Student", href: `/super-admin/coc/new${query}` }}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total",
            value: cocStudents.length,
            color:
              "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
          },
          {
            label: "Paid",
            value: cocStudents.filter((s) => s.paymentStatus === "PAID").length,
            color:
              "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
          },
          {
            label: "Pending",
            value: cocStudents.filter((s) => s.paymentStatus === "PENDING")
              .length,
            color:
              "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
          },
          {
            label: "Revenue (ETB)",
            value: totalRevenue.toLocaleString(),
            color:
              "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className={`rounded-xl p-4 ${color.split(" ").slice(0, 2).join(" ")}`}
          >
            <p
              className={`font-bold text-2xl ${color.split(" ").slice(2).join(" ")}`}
            >
              {value}
            </p>
            <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      <COCTable students={cocStudents} basePath="/super-admin/coc" />
    </div>
  );
}
