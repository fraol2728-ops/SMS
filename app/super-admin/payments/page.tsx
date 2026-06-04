export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminPaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ campusId?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { campusId } = (await searchParams) ?? {};

  const payments = await prisma.payment.findMany({
    where: campusId ? { user: { campusId } } : {},
    include: {
      user: true,
      enrollment: {
        include: {
          student: { select: { studentCode: true } },
          class: { include: { course: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalRevenue = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  );
  const monthlyRevenue = payments
    .filter((p) => p.status === "PAID" && new Date(p.createdAt) >= monthStart)
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Revenue",
            value: `ETB ${totalRevenue.toLocaleString()}`,
            color:
              "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400",
          },
          {
            label: "This Month",
            value: `ETB ${monthlyRevenue.toLocaleString()}`,
            color:
              "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
          },
          {
            label: "Transactions",
            value: payments.length,
            color:
              "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className={`rounded-2xl p-5 ${color.split(" ").slice(0, 2).join(" ")}`}
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

      <div className="overflow-hidden rounded-2xl border bg-white dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                {[
                  "Student",
                  "Course",
                  "Amount",
                  "Method",
                  "Status",
                  "Date",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-medium text-gray-400 text-xs"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr
                  key={p.id}
                  className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3 font-medium dark:text-white">
                    {p.user.firstName} {p.user.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {p.enrollment?.class?.course?.title ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-medium dark:text-white">
                    ETB {p.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {p.method ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        p.status === "PAID"
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(p.createdAt).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              No payments yet
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
