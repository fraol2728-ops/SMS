import Link from "next/link";
import { DataTable } from "@/components/admin/shared/DataTable";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth-check";
import { getCurrentUserCampusId } from "@/lib/campus";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  await requireAdmin();
  const campusId = await getCurrentUserCampusId();
  const rows = await prisma.user.findMany({
    where: { role: "TEACHER", ...(campusId ? { campusId } : {}) },
    include: { teacherProfile: { include: { classes: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Teachers"
        action={{ label: "Add teacher", href: "/admin/teachers/new" }}
      />
      <div className="space-y-2 md:hidden">
        {rows.map((t) => (
          <Link key={t.id} href={`/admin/teachers/${t.id}`}>
            <div className="flex items-center gap-3 rounded-xl border bg-white p-4 transition-all hover:border-blue-300 dark:border-gray-700 dark:bg-gray-900">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700 dark:bg-green-950 dark:text-green-300">
                {t.firstName[0]}
                {t.lastName[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900 dark:text-white">
                  {t.firstName} {t.lastName}
                </p>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {(t.teacherProfile?.specialties?.length
                    ? t.teacherProfile.specialties
                    : t.teacherProfile?.specialty
                      ? [t.teacherProfile.specialty]
                      : []
                  )
                    .slice(0, 2)
                    .map((specialty) => (
                      <span
                        key={specialty}
                        className="rounded-full bg-green-50 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-950 dark:text-green-300"
                      >
                        {specialty}
                      </span>
                    ))}
                </div>
              </div>
              <span className="ml-auto text-lg text-gray-400 dark:text-gray-500">
                ›
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="hidden md:block">
        <DataTable
          data={rows}
          columns={[
            {
              key: "code",
              label: "Code",
              render: (r) => r.teacherProfile?.teacherCode ?? "-",
            },
            {
              key: "name",
              label: "Name",
              render: (r) => `${r.firstName} ${r.lastName}`,
            },
            { key: "email", label: "Email" },
            {
              key: "specialty",
              label: "Specialties",
              render: (r) => {
                const specialties = r.teacherProfile?.specialties?.length
                  ? r.teacherProfile.specialties
                  : r.teacherProfile?.specialty
                    ? [r.teacherProfile.specialty]
                    : [];
                return specialties.length ? (
                  <div className="flex flex-wrap gap-1">
                    {specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="rounded-full bg-green-50 px-2 py-1 text-xs text-green-700 dark:bg-green-950 dark:text-green-300"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                ) : (
                  "-"
                );
              },
            },
            {
              key: "classes",
              label: "Classes count",
              render: (r) => r.teacherProfile?.classes.length ?? 0,
            },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/teachers/${r.id}`}>View</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/teachers/${r.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
