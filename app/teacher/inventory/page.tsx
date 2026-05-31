export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { Package } from "lucide-react";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";

export default async function TeacherInventoryPage() {
  await requireTeacher();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const teacher = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      teacherProfile: {
        include: {
          classes: {
            where: { isActive: true, status: "STARTED" },
            include: {
              lab: {
                include: {
                  assets: {
                    select: { id: true, condition: true, category: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!teacher?.teacherProfile) redirect("/unauthorized");

  const labsMap = new Map<
    string,
    (typeof teacher.teacherProfile.classes)[number]["lab"]
  >();
  teacher.teacherProfile.classes.forEach((c: any) => {
    if (c.lab && !labsMap.has(c.lab.id)) {
      labsMap.set(c.lab.id, c.lab);
    }
  });
  const labs = Array.from(labsMap.values());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-gray-900">Inventory</h1>
        <p className="mt-1 text-gray-500">View asset status in your labs</p>
      </div>

      {labs.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <Package size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400">No labs assigned to your classes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {labs.map((lab) => {
            const total = lab.assets.length;
            const issues = lab.assets.filter((a: any) =>
              ["DAMAGED", "MISSING", "UNDER_REPAIR"].includes(a.condition),
            ).length;
            return (
              <div key={lab.id} className="rounded-xl border bg-white p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{lab.name}</h3>
                    <p className="text-gray-400 text-xs">{total} assets</p>
                  </div>
                  {issues > 0 && (
                    <span className="rounded-full bg-red-50 px-2 py-1 text-red-700 text-xs">
                      {issues} issue{issues > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">
                  Contact an administrator to report inventory issues.
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
