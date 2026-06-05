export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { Phone, Trash2, Lock, Unlock } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteAdminButton } from "@/components/super-admin/DeleteAdminButton";
import { BlockAdminButton } from "@/components/super-admin/BlockAdminButton";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminAdminDetailPage({
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

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/super-admin/admins">
        <button
          className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          type="button"
        >
          ← Back to Admins
        </button>
      </Link>

      <div className="rounded-2xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl font-bold text-2xl text-white ${admin.role === "SUPER_ADMIN" ? "bg-purple-600" : "bg-blue-600"}`}
            >
              {admin.firstName[0]}
              {admin.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-2xl dark:text-white">
                  {admin.firstName} {admin.lastName}
                </h1>
                {!admin.isActive && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    <Lock size={12} /> Blocked
                  </span>
                )}
              </div>
              <span
                className={`rounded-full px-2 py-1 font-medium text-xs ${admin.role === "SUPER_ADMIN" ? "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}
              >
                {admin.role}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-4">
          {[
            {
              label: "Email",
              value: admin.email.includes("@exceed.local") ? "—" : admin.email,
            },
            { label: "Phone", value: admin.phone ?? "—" },
            { label: "Campus", value: admin.campus?.name ?? "All Campuses" },
            {
              label: "Joined",
              value: new Date(admin.createdAt).toLocaleDateString("en-GB"),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800"
            >
              <p className="mb-1 text-gray-400 text-xs">{label}</p>
              <p className="font-medium text-sm dark:text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          {admin.phone ? (
            <a
              href={`tel:${admin.phone}`}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-green-700"
            >
              <Phone size={15} /> Call {admin.phone}
            </a>
          ) : null}
          <Link href={`/super-admin/admins/${admin.id}/edit`}>
            <button
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-blue-700"
              type="button"
            >
              ✏️ Edit
            </button>
          </Link>
          <BlockAdminButton adminId={admin.id} isActive={admin.isActive} />
          <DeleteAdminButton adminId={admin.id} />
        </div>
      </div>
    </div>
  );
}
