export const dynamic = "force-dynamic";

import Link from "next/link";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { requireAdmin } from "@/lib/auth-check";
import { prisma } from "@/lib/prisma";
export default async function WaitlistPage() {
  await requireAdmin();
  const waitlist = await prisma.teacherWaitlist.findMany({
    where: { status: "PENDING" },
    orderBy: { appliedDate: "desc" },
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Waiting List"
        description="Prospective teachers waiting to join"
        action={{ label: "Add to waitlist", href: "/admin/waitlist/new" }}
      />
      {waitlist.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold">No one on the waiting list</p>
        </div>
      ) : (
        <div className="space-y-3">
          {waitlist.map((w) => (
            <Link key={w.id} href={`/admin/waitlist/${w.id}`}>
              <div className="bg-white border rounded-xl p-5 hover:border-blue-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                      {w.firstName[0]}
                      {w.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {w.firstName} {w.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        📱 {w.phone}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {w.courses.map((c) => (
                          <span
                            key={c}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(w.appliedDate).toLocaleDateString("en-GB")}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
