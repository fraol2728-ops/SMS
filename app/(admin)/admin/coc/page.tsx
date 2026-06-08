export const dynamic = "force-dynamic";

import { COCTable } from "@/components/admin/coc/COCTable";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export default async function COCPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const cocStudents = await prisma.cOCStudent.findMany({
    where: campusId ? { campusId } : {},
    include: {
      studentProfile: { include: { user: true } },
      addedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const totalRevenue = cocStudents
    .filter((s) => s.paymentStatus === "PAID" || s.paymentStatus === "PARTIAL")
    .reduce((sum, s) => sum + s.paymentAmount, 0);
  const paid = cocStudents.filter(
    (s) => s.paymentStatus === "PAID",
  ).length;
  const partial = cocStudents.filter(
    (s) => s.paymentStatus === "PARTIAL",
  ).length;
  const pending = cocStudents.filter(
    (s) => s.paymentStatus === "PENDING",
  ).length;
  return (
    <div className="space-y-6">
      <PageHeader
        title="COC Exam Students"
        description="Students registered for COC examinations"
        action={{ label: "Add Student", href: "/admin/coc/new" }}
      />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          {
            label: "Total Students",
            value: cocStudents.length,
            color: "bg-blue-50 text-blue-700",
          },
          {
            label: "Paid",
            value: paid,
            color: "bg-green-50 text-green-700",
          },
          {
            label: "Partial",
            value: partial,
            color: "bg-yellow-50 text-yellow-700",
          },
          {
            label: "Pending",
            value: pending,
            color: "bg-amber-50 text-amber-700",
          },
          {
            label: "Revenue (ETB)",
            value: totalRevenue.toLocaleString(),
            color: "bg-purple-50 text-purple-700",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className={`rounded-xl p-4 ${color.split(" ")[0]} dark:bg-opacity-20`}
          >
            <p className={`text-2xl font-bold ${color.split(" ")[1]}`}>
              {value}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {label}
            </p>
          </div>
        ))}
      </div>
      <COCTable students={cocStudents} />
    </div>
  );
}
